import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, AnyMindMapItem, MindMapImage, MindMapPath, MindMapText, MindMapShape, MindMapStickyNote } from '../types';
import { Trash2Icon, TypeIcon, ImageIcon, MinusIcon, PlusIcon, PenToolIcon, EraserIcon, BrainCircuitIcon, DownloadIcon, StickyNoteIcon, SquareIcon, CircleIcon, LoaderIcon, RotateCcwIcon, RotateCwIcon, BoldIcon, ItalicIcon, SendToBackIcon, BringToFrontIcon } from './icons';
import { getMindMapIdeas } from '../services/geminiService';

type Tool = 'select' | 'text' | 'image' | 'draw' | 'shape' | 'sticky-note' | 'eraser';
type ShapeType = 'rectangle' | 'ellipse';
type InteractionState =
    | { type: 'none' }
    | { type: 'panning'; start: { x: number; y: number } }
    | { type: 'moving'; itemIds: string[]; start: { x: number; y: number }; itemStarts: { id: string, x: number; y: number }[] }
    | { type: 'resizing'; itemId: string; handle: string; start: { x: number; y: number }; itemStart: { x: number; y: number; width: number; height: number } }
    | { type: 'drawing'; points: { x: number; y: number }[]; style: { stroke: string; strokeWidth: number; } }
    | { type: 'shaping'; shapeType: ShapeType; start: { x: number; y: number }; end: { x: number; y: number } };

const MIN_SCALE = 0.1;
const MAX_SCALE = 4;

// --- Helper & UI Components ---

const ToolbarButton: React.FC<{ title: string; isActive?: boolean; onClick: (e: React.MouseEvent) => void; children: React.ReactNode; className?: string }> = ({ title, isActive, onClick, children, className }) => (
    <button title={title} onClick={onClick} className={`p-3 rounded-lg transition-colors ${isActive ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'} ${className}`}>
        {children}
    </button>
);

const DrawCursor: React.FC<{ position: {x: number, y: number}, style: { stroke: string; strokeWidth: number; }, scale: number }> = ({ position, style, scale }) => (
    <circle cx={position.x} cy={position.y} r={style.strokeWidth / 2 / scale} fill={style.stroke} stroke="rgba(255,255,255,0.7)" strokeWidth={1 / scale} className="pointer-events-none" />
);

const SelectionBox: React.FC<{ item: AnyMindMapItem; scale: number; onResizeStart: (handle: string, e: React.MouseEvent) => void }> = ({ item, scale, onResizeStart }) => {
    const handles = ['nw', 'ne', 'sw', 'se'];
    const handleCursors: { [key: string]: string } = { nw: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', se: 'nwse-resize' };
    
    return (
        <g data-id={`selection-box-${item.id}`}>
            <rect x={item.x} y={item.y} width={item.width} height={item.height} fill="none" stroke="rgb(var(--color-primary-500))" strokeWidth={2 / scale} strokeDasharray={`${4 / scale} ${4 / scale}`} />
            {handles.map(handle => {
                const handleSize = 12 / scale;
                const handleOffset = handleSize / 2;
                const handleX = handle.includes('e') ? item.x + item.width - handleOffset : item.x - handleOffset;
                const handleY = handle.includes('s') ? item.y + item.height - handleOffset : item.y - handleOffset;
                return (
                    <rect key={handle} x={handleX} y={handleY} width={handleSize} height={handleSize} fill="rgb(var(--color-primary-500))" stroke="#fff" strokeWidth={2 / scale} style={{ cursor: handleCursors[handle] }} onMouseDown={(e) => onResizeStart(handle, e)} />
                );
            })}
        </g>
    );
};

const ColorPalette: React.FC<{ onSelect: (color: string) => void }> = ({ onSelect }) => {
    const colors = ['#1f2937', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#fffe9b', '#d0fefe', '#ffc5d0'];
    return (
        <div className="flex gap-1">
            {colors.map(color => <button key={color} onClick={() => onSelect(color)} className="w-5 h-5 rounded-full border border-gray-400" style={{ backgroundColor: color }} />)}
        </div>
    );
};

const ContextualMenu: React.FC<{
    item: AnyMindMapItem;
    position: { top: number; left: number };
    onDelete: () => void;
    onLayerChange: (direction: 'forward' | 'backward') => void;
    onStyleChange: (styleUpdate: any) => void;
}> = ({ item, position, onDelete, onLayerChange, onStyleChange }) => {
    return (
        <div style={{ top: position.top, left: position.left }} className="absolute z-30 flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {(item.type === 'text' || item.type === 'sticky-note') && (
                <>
                    <button onClick={() => onStyleChange({ bold: !item.style.bold })} className={`p-1.5 rounded ${ item.style.bold ? 'bg-primary-200 dark:bg-primary-800' : ''}`}><BoldIcon className="w-4 h-4" /></button>
                    <button onClick={() => onStyleChange({ italic: !item.style.italic })} className={`p-1.5 rounded ${ item.style.italic ? 'bg-primary-200 dark:bg-primary-800' : ''}`}><ItalicIcon className="w-4 h-4" /></button>
                    <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
                    <ColorPalette onSelect={color => onStyleChange({ background: color })} />
                    <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
                </>
            )}
            {(item.type === 'shape' || item.type === 'path') && (
                <>
                    <ColorPalette onSelect={color => onStyleChange(item.type === 'shape' ? { fill: color } : { stroke: color })} />
                    <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
                </>
            )}
            <button onClick={() => onLayerChange('backward')} className="p-1.5 rounded"><SendToBackIcon className="w-4 h-4" /></button>
            <button onClick={() => onLayerChange('forward')} className="p-1.5 rounded"><BringToFrontIcon className="w-4 h-4" /></button>
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
            <button onClick={onDelete} className="p-1.5 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"><Trash2Icon className="w-4 h-4" /></button>
        </div>
    );
};

// --- Main Whiteboard Component ---

export const MindMap: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const activeMap = state.activeMindMapId ? state.mindMaps[state.activeMindMapId] : null;

    const [items, setItems] = useState(activeMap?.items || {});
    const [displayOrder, setDisplayOrder] = useState(activeMap?.displayOrder || []);
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [activeTool, setActiveTool] = useState<Tool>('select');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [interaction, setInteraction] = useState<InteractionState>({ type: 'none' });
    const [drawStyle, setDrawStyle] = useState({ stroke: '#1f2937', strokeWidth: 4 });
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (interaction.type === 'none' && !editingItemId) {
            if (activeMap) {
                setItems(activeMap.items || {});
                setDisplayOrder(activeMap.displayOrder || []);
            } else {
                setItems({});
                setDisplayOrder([]);
            }
        }
    }, [activeMap, interaction.type, editingItemId]);

    const saveChanges = useCallback((newItems: { [id: string]: AnyMindMapItem; }, newDisplayOrder: string[]) => {
        if (activeMap) {
            dispatch({ type: ActionType.UPDATE_MINDMAP, payload: { id: activeMap.id, updates: { items: newItems, displayOrder: newDisplayOrder } } });
        }
    }, [activeMap, dispatch]);

    const screenToSvgCoords = useCallback((screenX: number, screenY: number) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const pt = svgRef.current.createSVGPoint();
        pt.x = screenX;
        pt.y = screenY;
        const ctm = svgRef.current.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };
        return pt.matrixTransform(ctm.inverse());
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const { deltaY } = e;
        const scaleFactor = 1.1;
        const newScale = deltaY < 0 ? view.scale * scaleFactor : view.scale / scaleFactor;
        if (newScale >= MIN_SCALE && newScale <= MAX_SCALE) {
            const rect = svgRef.current!.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const newViewX = mouseX - (mouseX - view.x) * (newScale / view.scale);
            const newViewY = mouseY - (mouseY - view.y) * (newScale / view.scale);
            setView({ x: newViewX, y: newViewY, scale: newScale });
        }
    };
    
    const addNewItem = (item: AnyMindMapItem) => {
        const newItems = { ...items, [item.id]: item };
        const newDisplayOrder = [...displayOrder, item.id];
        setItems(newItems);
        setDisplayOrder(newDisplayOrder);
        saveChanges(newItems, newDisplayOrder);
        return { newItems, newDisplayOrder };
    };

    const handleAddText = (x: number, y: number, text: string = 'New Text', style: Partial<MindMapText['style']> = {}) => {
        const newItem: MindMapText = {
            id: `text-${Date.now()}`, type: 'text', x, y, width: 150, height: 50, text,
            style: { fontSize: 16, fontFamily: 'sans-serif', color: '#1f2937', background: '#ffffff', bold: false, italic: false, align: 'center', ...style }
        };
        addNewItem(newItem);
        setSelectedItemId(newItem.id);
        setEditingItemId(newItem.id);
        setActiveTool('select');
    };
    
    const handleDeleteItem = (itemId: string) => {
        const newItems = { ...items };
        delete newItems[itemId];
        const newDisplayOrder = displayOrder.filter(id => id !== itemId);
        setItems(newItems);
        setDisplayOrder(newDisplayOrder);
        saveChanges(newItems, newDisplayOrder);
        if (selectedItemId === itemId) setSelectedItemId(null);
    };

    const handleLayerChange = (direction: 'forward' | 'backward') => {
        if (!selectedItemId) return;
        const index = displayOrder.indexOf(selectedItemId);
        if (index === -1) return;
        const newDisplayOrder = [...displayOrder];
        if (direction === 'forward' && index < newDisplayOrder.length - 1) {
            [newDisplayOrder[index], newDisplayOrder[index + 1]] = [newDisplayOrder[index + 1], newDisplayOrder[index]];
        } else if (direction === 'backward' && index > 0) {
            [newDisplayOrder[index], newDisplayOrder[index - 1]] = [newDisplayOrder[index - 1], newDisplayOrder[index]];
        }
        setDisplayOrder(newDisplayOrder);
        saveChanges(items, newDisplayOrder);
    };
    
    const handleStyleChange = (styleUpdate: any) => {
        if (!selectedItemId) return;
        const item = items[selectedItemId];
        if (!item || !('style' in item)) return;

        const newItems = { ...items, [selectedItemId]: { ...item, style: { ...item.style, ...styleUpdate } } };
        setItems(newItems);
        saveChanges(newItems, displayOrder);
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.key === 'Backspace' || e.key === 'Delete') && selectedItemId && !editingItemId) {
            handleDeleteItem(selectedItemId);
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            if (activeMap) dispatch({ type: ActionType.UNDO_MINDMAP, payload: { id: activeMap.id } });
        } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
            e.preventDefault();
            if (activeMap) dispatch({ type: ActionType.REDO_MINDMAP, payload: { id: activeMap.id } });
        }
    }, [selectedItemId, editingItemId, activeMap, dispatch]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (selectedItemId && items[selectedItemId] && svgRef.current) {
            const itemElement = svgRef.current.querySelector(`[data-item-id="${selectedItemId}"]`);
            if (itemElement) {
                const rect = itemElement.getBoundingClientRect();
                const containerRect = mainContainerRef.current!.getBoundingClientRect();
                setMenuPosition({ top: rect.bottom - containerRect.top + 10, left: rect.left - containerRect.top });
            }
        } else {
            setMenuPosition(null);
        }
    }, [selectedItemId, items, view]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { x, y } = screenToSvgCoords(clientX, clientY);
        if (activeTool === 'text') { handleAddText(x, y); return; }
        if (activeTool === 'draw') { setInteraction({ type: 'drawing', points: [{ x, y }], style: drawStyle }); return; }
        setInteraction({ type: 'panning', start: { x: clientX, y: clientY } });
        setSelectedItemId(null);
        setEditingItemId(null);
    };

    const handleItemMouseDown = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeTool === 'eraser') { handleDeleteItem(itemId); return; }
        if (activeTool !== 'select') return;
        
        const { clientX, clientY } = e;
        const item = items[itemId];
        setSelectedItemId(itemId);
        setEditingItemId(null);
        setInteraction({ type: 'moving', itemIds: [itemId], start: { x: clientX, y: clientY }, itemStarts: [{id: itemId, x: item.x, y: item.y}] });
    };

    const handleResizeStart = (handle: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedItemId) return;
        const { clientX, clientY } = e;
        const item = items[selectedItemId];
        setInteraction({ type: 'resizing', itemId: selectedItemId, handle, start: { x: clientX, y: clientY }, itemStart: { x: item.x, y: item.y, width: item.width, height: item.height } });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const svgCoords = screenToSvgCoords(clientX, clientY);
        setMousePos(svgCoords);
        
        if (interaction.type === 'panning') {
            const dx = clientX - interaction.start.x;
            const dy = clientY - interaction.start.y;
            setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
            setInteraction({ ...interaction, start: { x: clientX, y: clientY } });
        } else if (interaction.type === 'moving') {
            const newItems = { ...items };
            interaction.itemStarts.forEach(start => {
                const dx = (clientX - interaction.start.x) / view.scale;
                const dy = (clientY - interaction.start.y) / view.scale;
                newItems[start.id] = { ...newItems[start.id], x: start.x + dx, y: start.y + dy };
            });
            setItems(newItems);
        } else if (interaction.type === 'resizing') {
            const dx = (clientX - interaction.start.x) / view.scale;
            const dy = (clientY - interaction.start.y) / view.scale;
            let {x: newX, y: newY, width: newWidth, height: newHeight} = interaction.itemStart;
            if (interaction.handle.includes('e')) newWidth += dx;
            if (interaction.handle.includes('w')) { newWidth -= dx; newX += dx; }
            if (interaction.handle.includes('s')) newHeight += dy;
            if (interaction.handle.includes('n')) { newHeight -= dy; newY += dy; }
            if (newWidth > 20 && newHeight > 20) setItems(ci => ({ ...ci, [interaction.itemId]: { ...ci[interaction.itemId], x: newX, y: newY, width: newWidth, height: newHeight } }));
        } else if (interaction.type === 'drawing') {
            setInteraction({ ...interaction, points: [...interaction.points, svgCoords] });
        }
    };
    
    const handleMouseUp = () => {
        if (interaction.type === 'drawing') {
            const { points, style } = interaction;
            if (points.length > 1) {
                const minX = Math.min(...points.map(p => p.x)), minY = Math.min(...points.map(p => p.y)), maxX = Math.max(...points.map(p => p.x)), maxY = Math.max(...points.map(p => p.y));
                const newPath: MindMapPath = { id: `path-${Date.now()}`, type: 'path', x: minX, y: minY, width: maxX - minX, height: maxY - minY, d: points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x - minX} ${p.y - minY}`).join(' '), style: {...style, fill: 'none'} };
                addNewItem(newPath);
            }
        } else if (interaction.type === 'moving' || interaction.type === 'resizing') {
            saveChanges(items, displayOrder);
        }
        setInteraction({ type: 'none' });
    };
    
    if (!activeMap) return <div className="flex-1 flex items-center justify-center">Select or create a whiteboard to get started.</div>;
    
    const selectedItem = selectedItemId ? items[selectedItemId] : null;
    const cursorClass = activeTool === 'select' ? (interaction.type.includes('pan') || interaction.type.includes('mov') ? 'cursor-grabbing' : 'cursor-grab') : activeTool === 'draw' ? 'none' : 'crosshair';

    return (
        <div ref={mainContainerRef} className="h-full flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden relative" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
             <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-lg shadow-lg">
                <ToolbarButton title="Select & Move" isActive={activeTool === 'select'} onClick={() => setActiveTool('select')}><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 14.5L9 22.5 4 2 22 9.5 14.5 14.5z"/></svg></ToolbarButton>
                <ToolbarButton title="Draw" isActive={activeTool === 'draw'} onClick={() => setActiveTool('draw')}><PenToolIcon className="w-6 h-6" /></ToolbarButton>
                <ToolbarButton title="Eraser" isActive={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')}><EraserIcon className="w-6 h-6" /></ToolbarButton>
                <ToolbarButton title="Add Text" isActive={activeTool === 'text'} onClick={() => setActiveTool('text')}><TypeIcon className="w-6 h-6" /></ToolbarButton>
            </div>
            {activeTool === 'draw' && (
                <div className="absolute top-4 left-24 z-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-3 rounded-lg shadow-lg space-y-3">
                    <ColorPalette onSelect={c => setDrawStyle(s => ({...s, stroke: c}))} />
                </div>
            )}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 p-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full shadow-lg">
                <button onClick={() => dispatch({ type: ActionType.UNDO_MINDMAP, payload: { id: activeMap.id } })} disabled={activeMap.historyIndex <= 0} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"><RotateCcwIcon className="w-5 h-5"/></button>
                <button onClick={() => dispatch({ type: ActionType.REDO_MINDMAP, payload: { id: activeMap.id } })} disabled={activeMap.historyIndex >= activeMap.history.length - 1} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"><RotateCwIcon className="w-5 h-5"/></button>
                <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                <button onClick={() => setView(v => ({...v, scale: Math.max(MIN_SCALE, v.scale - 0.1)}))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><MinusIcon className="w-5 h-5"/></button>
                <span className="font-mono text-sm w-12 text-center">{Math.round(view.scale * 100)}%</span>
                <button onClick={() => setView(v => ({...v, scale: Math.min(MAX_SCALE, v.scale + 0.1)}))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><PlusIcon className="w-5 h-5"/></button>
            </div>
            
            <svg ref={svgRef} className="w-full h-full" style={{cursor: cursorClass}} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseLeave={handleMouseUp}>
                <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
                    {displayOrder.map(id => items[id]).filter(Boolean).map(item => {
                         const commonProps = { key: item.id, 'data-item-id': item.id, onMouseDown: (e: React.MouseEvent) => handleItemMouseDown(item.id, e) };
                        switch(item.type) {
                            case 'path': return <path {...commonProps} d={(item as MindMapPath).d} transform={`translate(${item.x}, ${item.y})`} stroke={(item.style as MindMapPath['style']).stroke} strokeWidth={(item.style as MindMapPath['style']).strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{cursor: 'move'}} />;
                            case 'text': case 'sticky-note': const textItem = item as MindMapText | MindMapStickyNote; return <foreignObject {...commonProps} x={item.x} y={item.y} width={item.width} height={item.height} onDoubleClick={() => setEditingItemId(item.id)}><div className="w-full h-full p-2 overflow-hidden box-border" style={{ backgroundColor: item.style.background, color: item.style.color, fontFamily: item.style.fontFamily, textAlign: item.style.align, fontWeight: item.style.bold ? 'bold' : 'normal', fontStyle: item.style.italic ? 'italic' : 'normal', cursor: 'move', whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{editingItemId === item.id ? <textarea defaultValue={textItem.text} onBlur={(e) => { const newText = e.target.value; const newItems = { ...items, [textItem.id]: { ...items[textItem.id], text: newText } }; setItems(newItems); saveChanges(newItems, displayOrder); setEditingItemId(null); }} autoFocus onMouseDown={e => e.stopPropagation()} className="w-full h-full bg-transparent resize-none focus:outline-none" style={{textAlign: item.style.align}}/> : item.text}</div></foreignObject>
                            default: return null;
                        }
                    })}
                    {interaction.type === 'drawing' && <path d={interaction.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} stroke={interaction.style.stroke} strokeWidth={interaction.style.strokeWidth / view.scale} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
                    {selectedItem && <SelectionBox item={selectedItem} scale={view.scale} onResizeStart={handleResizeStart} />}
                    {activeTool === 'draw' && interaction.type !== 'panning' && <DrawCursor position={mousePos} style={drawStyle} scale={view.scale} />}
                </g>
            </svg>
            {selectedItem && menuPosition && <ContextualMenu item={selectedItem} position={menuPosition} onDelete={() => handleDeleteItem(selectedItem.id)} onLayerChange={handleLayerChange} onStyleChange={handleStyleChange} />}
        </div>
    );
};
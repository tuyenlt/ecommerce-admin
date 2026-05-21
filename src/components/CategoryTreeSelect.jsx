import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CategoryTreeNode = ({ node, level, selectedId, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.subCategories && node.subCategories.length > 0;
  // If no subCategories, maybe check children just in case
  const childrenList = node.subCategories || node.children || [];
  const hasAnyChildren = childrenList.length > 0;
  
  const isSelected = selectedId === node.id;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 hover:bg-accent rounded-sm cursor-pointer",
          isSelected && "bg-accent text-accent-foreground font-medium"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id, node);
        }}
      >
        {hasAnyChildren ? (
          <button 
            type="button"
            className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-4 h-4 shrink-0 inline-block" /> // Spacer
        )}
        <span className="flex-1 truncate">{node.name}</span>
        {isSelected && <Check className="w-4 h-4 ml-2 shrink-0" />}
      </div>
      
      {hasAnyChildren && expanded && (
        <div className="flex flex-col">
          {childrenList.map(child => (
            <CategoryTreeNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              selectedId={selectedId} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function CategoryTreeSelect({ categories, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSelectedName = (cats, id) => {
    if (!cats || !id) return null;
    for (const cat of cats) {
      if (cat.id === id) return cat.name;
      const children = cat.subCategories || cat.children || [];
      if (children.length > 0) {
        const found = getSelectedName(children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedName = value ? getSelectedName(categories, value) : "Chọn danh mục";

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          !value && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedName}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1">
          {categories.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">Không có dữ liệu</div>
          ) : (
            categories.map(cat => (
              <CategoryTreeNode 
                key={cat.id} 
                node={cat} 
                level={0} 
                selectedId={value} 
                onSelect={(id) => {
                  onChange(id);
                  setIsOpen(false);
                }} 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ChipGroup Component
 * Horizontal scrollable group of chips
 */

import { Chip } from './Chip';

interface ChipOption {
  id: string;
  label: string;
}

interface ChipGroupProps {
  options: ChipOption[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  className?: string;
}

export function ChipGroup({ 
  options, 
  selectedIds, 
  onSelect, 
  className 
}: ChipGroupProps) {
  const handleChipClick = (id: string) => {
    onSelect(id);
  };

  return (
    <div className={`overflow-x-auto -mx-1 px-1 ${className || ''}`}>
      <div className="flex gap-2 pb-1">
        {options.map((option) => (
          <Chip
            key={option.id}
            label={option.label}
            selected={selectedIds.includes(option.id)}
            onClick={() => handleChipClick(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

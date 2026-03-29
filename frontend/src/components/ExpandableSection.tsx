import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ExpandableSectionProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  accent?: 'default' | 'red' | 'amber' | 'emerald';
}

const accentStyles = {
  default: 'border-gray-200 hover:border-gray-300',
  red: 'border-red-200 hover:border-red-300',
  amber: 'border-amber-200 hover:border-amber-300',
  emerald: 'border-emerald-200 hover:border-emerald-300',
};

export default function ExpandableSection({
  title,
  children,
  defaultOpen = false,
  badge,
  accent = 'default',
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${accentStyles[accent]}`}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown size={14} className="text-gray-400 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
          )}
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

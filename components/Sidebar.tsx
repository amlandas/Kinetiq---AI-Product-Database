import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../data';
import { LayoutGrid, Filter, Bookmark, Plus, Trash2, Save } from 'lucide-react';
import { FilterState } from '../types';

interface SidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  className?: string;
  onHomeClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ filters, setFilters, isOpen, className, onHomeClick }) => {
  // Preset Logic
  const [presets, setPresets] = useState<{ name: string; filters: FilterState }[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kinetiq_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse presets", e);
      }
    }
  }, []);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPresets = [...presets, { name: newPresetName, filters }];
    setPresets(newPresets);
    localStorage.setItem('kinetiq_presets', JSON.stringify(newPresets));
    setNewPresetName('');
    setShowSavePreset(false);
  };

  const handleLoadPreset = (presetFilters: FilterState) => {
    setFilters(presetFilters);
  };

  const handleDeletePreset = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPresets = presets.filter((_, i) => i !== index);
    setPresets(newPresets);
    localStorage.setItem('kinetiq_presets', JSON.stringify(newPresets));
  };
  const handleCategoryClick = (category: string) => {
    setFilters(prev => {
      const current = prev.category;
      const isSelected = current.includes(category);
      let newCategories: string[];

      if (isSelected) {
        newCategories = current.filter(c => c !== category);
      } else {
        newCategories = [...current, category];
      }

      return {
        ...prev,
        category: newCategories,
        subCategory: null // Reset sub-category when changing main categories logic (optional: could keep if relevant, but safer to reset)
      };
    });
  };

  const handleSubCategoryClick = (sub: string) => {
    setFilters(prev => ({
      ...prev,
      subCategory: prev.subCategory === sub ? null : sub
    }));
  };

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 md:static ${className}
    `}>
      <div className="h-full flex flex-col overflow-y-auto p-4">
        <div
          onClick={onHomeClick}
          className="flex items-center space-x-2 mb-6 px-2 cursor-pointer hover:opacity-80 transition-opacity"
          title="Return to Home"
        >
          <div className="bg-primary-600 p-2 rounded-lg">
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900 dark:text-white block leading-none">Kinetiq</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Product DB</span>
          </div>
        </div>

        {/* Reset Filters - High Visibility (Usability Fix) */}
        {(filters.category.length > 0 || filters.pricing.length > 0 || filters.minRating > 0 || filters.search) && (
          <button
            onClick={onHomeClick}
            className="mb-6 mx-2 flex items-center justify-center space-x-2 text-sm bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        )}

        <nav className="space-y-6 flex-1">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Categories</h3>
            <ul className="space-y-1">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded-md transition-colors ${filters.category.includes(cat.name)
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-900'
                      }`}
                  >
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full px-2 py-0.5">
                      {cat.subCategories.length}
                    </span>
                  </button>

                  {filters.category.includes(cat.name) && (
                    <ul className="mt-1 ml-4 space-y-1 border-l-2 border-gray-100 dark:border-gray-700 pl-2">
                      {cat.subCategories.map((sub) => (
                        <li key={sub}>
                          <button
                            onClick={() => handleSubCategoryClick(sub)}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${filters.subCategory === sub
                              ? 'text-primary-600 font-medium'
                              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                              }`}
                          >
                            {sub}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>


          <div>
            <div className="flex items-center justify-between px-2 mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saved Searches</h3>
              <button
                onClick={() => setShowSavePreset(!showSavePreset)}
                className="text-gray-400 hover:text-primary-600 transition-colors"
                title="Save current filters"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showSavePreset && (
              <div className="px-2 mb-4 animate-fade-in">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Name this view..."
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-dark-900 dark:text-white"
                    autoFocus
                  />
                  <button
                    onClick={handleSavePreset}
                    disabled={!newPresetName.trim()}
                    className="p-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1 px-2">
              {presets.length === 0 && !showSavePreset && (
                <p className="text-xs text-gray-400 italic pl-2">No saved searches yet</p>
              )}
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadPreset(preset.filters)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-900 group transition-colors"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Bookmark className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{preset.name}</span>
                  </div>
                  <div
                    onClick={(e) => handleDeletePreset(idx, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Filters</h3>
            <div className="space-y-4 px-2">
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-500 mb-3">Pricing</h4>
                <div className="space-y-2">
                  {['Free', 'Freemium', 'Paid'].map((price) => (
                    <label key={price} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.pricing.includes(price)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, pricing: [...prev.pricing, price] }));
                          } else {
                            setFilters(prev => ({ ...prev, pricing: prev.pricing.filter(p => p !== price) }));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{price}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">Min Rating: {filters.minRating}+</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(parseFloat(e.target.value).toFixed(1)) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700 px-2">
          <button
            onClick={onHomeClick}
            className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
          >
            <Filter className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        </div>
      </div >
    </aside >
  );
};

export default Sidebar;
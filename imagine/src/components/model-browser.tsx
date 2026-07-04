'use client';

import { useState } from 'react';
import { Search, X, Sparkles, Zap, Star } from 'lucide-react';

interface ModelParameter {
  name: string;
  type: 'number' | 'select' | 'boolean';
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  options?: string[];
}

interface Model {
  id: string;
  name: string;
  description: string;
  category: string;
  speed: string;
  quality: string;
  parameters?: ModelParameter[];
}

interface ModelBrowserProps {
  models: Model[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export function ModelBrowser({ models, selectedModel, onSelectModel }: ModelBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(models.map(m => m.category)));

  // Filter models
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || model.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getSpeedColor = (speed: string) => {
    if (speed === 'very-fast' || speed === 'fast') return 'text-green-600';
    if (speed === 'medium') return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getQualityStars = (quality: string) => {
    if (quality === 'best') return 5;
    if (quality === 'very-high') return 4;
    if (quality === 'high') return 3;
    return 2;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Model Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map(model => (
          <button
            key={model.id}
            onClick={() => onSelectModel(model.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              selectedModel === model.id
                ? 'border-purple-600 bg-purple-50 shadow-lg'
                : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{model.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{model.description}</p>
              </div>
              {selectedModel === model.id && (
                <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 ml-2" />
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {/* Speed Badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs font-medium ${getSpeedColor(model.speed)}`}>
                <Zap className="h-3 w-3" />
                {model.speed}
              </div>

              {/* Quality Stars */}
              <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-gray-100">
                {Array.from({ length: getQualityStars(model.quality) }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Category Badge */}
              <div className="px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                {model.category}
              </div>
            </div>

            {/* Parameter Count */}
            {model.parameters && model.parameters.length > 0 ? (
              <div className="mt-2 text-xs text-gray-500">
                {model.parameters.length} customizable parameter{model.parameters.length !== 1 ? 's' : ''}
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-400 italic">
                Standard settings only
              </div>
            )}
          </button>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No models found matching your search.</p>
        </div>
      )}
    </div>
  );
}

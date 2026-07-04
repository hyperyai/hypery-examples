'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Sparkles, Loader2, Download, Trash2, LogOut, Image as ImageIcon, Settings } from 'lucide-react';
import Image from 'next/image';
import { ModelBrowser } from './model-browser';

interface GeneratedImage {
  id: string;
  prompt: string;
  model: string;
  images: string[];
  cost: number;
  createdAt: string;
  status?: 'pending' | 'completed' | 'failed';
  error?: string;
}

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

export function ImageGenerator() {
  const { accessToken, logout } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('black-forest-labs/flux-schnell');
  const [models, setModels] = useState<Model[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelParams, setModelParams] = useState<Record<string, any>>({});
  const [showModelBrowser, setShowModelBrowser] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  // Get current model's parameters
  const currentModel = models.find(m => m.id === selectedModel);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        console.log('🔄 [UI] Fetching models...');
        const response = await fetch(`${API_URL}/images/models`);
        const models = await response.json();
        console.log('📦 [UI] Models response:', models);
        if (Array.isArray(models)) {
          setModels(models);
          console.log(`✅ [UI] Loaded ${models.length} models`);
          // Log parameter counts for each model
          models.forEach((model: Model) => {
            console.log(`  - ${model.name}: ${model.parameters?.length || 0} parameters`);
          });
        } else {
          console.warn('⚠️ [UI] No models in response:', models);
        }
      } catch (err) {
        console.error('❌ [UI] Failed to fetch models:', err);
        setError('Failed to load models. Please refresh the page.');
      }
    };

    fetchModels();
  }, []);

  // Initialize model parameters with defaults when model changes
  useEffect(() => {
    if (currentModel?.parameters) {
      const defaults: Record<string, any> = {};
      currentModel.parameters.forEach(param => {
        defaults[param.name] = param.default;
      });
      setModelParams(defaults);
    }
  }, [selectedModel, models]);

  // Fetch image history
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`${API_URL}/images`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setImages(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch images:', err);
      }
    };

    if (accessToken) {
      fetchImages();
    }
  }, [accessToken]);

  // Poll for pending images
  useEffect(() => {
    if (!accessToken) return;
    
    const hasPendingImages = images.some(img => img.status === 'pending');
    
    if (hasPendingImages) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/images`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const data = await response.json();
          if (data.success) {
            setImages(data.data);
          }
        } catch (err) {
          console.error('Failed to poll images:', err);
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(pollInterval);
    }
  }, [accessToken, images]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/images/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negative_prompt: negativePrompt.trim() || undefined,
          model: selectedModel,
          ...modelParams,
        }),
      });

      const prediction = await response.json();

      if (!response.ok) {
        throw new Error(prediction.detail || prediction.error || 'Generation failed');
      }

      // Replicate format (no wrapper)
      // Add new image to the list
      setImages([
        {
          id: prediction.id,
          prompt,
          model: selectedModel,
          images: prediction.output ? (Array.isArray(prediction.output) ? prediction.output : [prediction.output]) : [],
          cost: 0, // Cost tracked server-side
          createdAt: new Date().toISOString(),
          status: prediction.status === 'succeeded' ? 'completed' : 'pending',
        },
        ...images,
      ]);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/images?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setImages(images.filter((img) => img.id !== id));
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Imagine
              </h1>
              <p className="text-sm text-gray-500">AI Image Generation</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Generation Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="space-y-4">
            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
                disabled={isGenerating}
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Negative Prompt (Optional)
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to avoid in the image..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isGenerating}
              />
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <button
                onClick={() => setShowModelBrowser(!showModelBrowser)}
                type="button"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                disabled={isGenerating}
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {currentModel?.name || 'Select a model'}
                  </div>
                  {currentModel && (
                    <div className="text-sm text-gray-500 truncate">
                      {currentModel.description}
                    </div>
                  )}
                </div>
                <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0" />
              </button>

              {/* Model Browser Modal */}
              {showModelBrowser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">Choose a Model</h2>
                      <button
                        onClick={() => setShowModelBrowser(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1">
                      <ModelBrowser
                        models={models}
                        selectedModel={selectedModel}
                        onSelectModel={(modelId) => {
                          setSelectedModel(modelId);
                          setShowModelBrowser(false);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Settings Toggle */}
            {currentModel?.parameters && currentModel.parameters.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  type="button"
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  <Settings className="h-4 w-4" />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                  <svg
                    className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dynamic Model Parameters */}
                {showAdvanced && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentModel.parameters.map((param) => (
                        <div key={param.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {param.label}
                          </label>
                          {param.type === 'number' && (
                            <div className="space-y-1">
                              <input
                                type="range"
                                min={param.min}
                                max={param.max}
                                step={param.step}
                                value={modelParams[param.name] || param.default}
                                onChange={(e) =>
                                  setModelParams({
                                    ...modelParams,
                                    [param.name]: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full"
                                disabled={isGenerating}
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={param.min}
                                  max={param.max}
                                  step={param.step}
                                  value={modelParams[param.name] || param.default}
                                  onChange={(e) =>
                                    setModelParams({
                                      ...modelParams,
                                      [param.name]: parseFloat(e.target.value),
                                    })
                                  }
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  disabled={isGenerating}
                                />
                                <span className="text-xs text-gray-500">
                                  ({param.min} - {param.max})
                                </span>
                              </div>
                            </div>
                          )}
                          {param.type === 'select' && param.options && (
                            <select
                              value={modelParams[param.name] || param.default}
                              onChange={(e) =>
                                setModelParams({
                                  ...modelParams,
                                  [param.name]: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              disabled={isGenerating}
                            >
                              {param.options.map((option: string) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                          {param.type === 'boolean' && (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={modelParams[param.name] || param.default}
                                onChange={(e) =>
                                  setModelParams({
                                    ...modelParams,
                                    [param.name]: e.target.checked,
                                  })
                                }
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                disabled={isGenerating}
                              />
                              <span className="text-sm text-gray-600">Enable</span>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Image
                </>
              )}
            </button>
          </div>
        </div>

        {/* Image Gallery */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Your Images
          </h2>
          {images.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No images yet. Start generating!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative aspect-square bg-gray-100">
                    {img.status === 'pending' ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                        <p className="text-sm text-gray-600">Generating...</p>
                      </div>
                    ) : img.status === 'failed' ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
                        <div className="text-4xl">⚠️</div>
                        <p className="text-sm text-red-600 text-center">{img.error || 'Generation failed'}</p>
                      </div>
                    ) : img.images && img.images.length > 0 && img.images[0] && typeof img.images[0] === 'string' && img.images[0].trim() !== '' ? (
                      <Image
                        src={img.images[0]}
                        alt={img.prompt}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-gray-700 line-clamp-2">{img.prompt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{img.model.split('/')[1]}</span>
                      <span>{img.cost} credits</span>
                    </div>
                    <div className="flex gap-2">
                      {img.status === 'completed' && img.images && img.images.length > 0 && img.images[0] && typeof img.images[0] === 'string' ? (
                        <a
                          href={img.images[0]}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      ) : (
                        <button
                          disabled
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(img.id)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

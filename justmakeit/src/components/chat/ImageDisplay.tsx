/**
 * Image Display Component
 * Displays generated images with auto-polling for async generation
 */

'use client';

import { useState, useEffect } from 'react';
import { useHyperyAuth } from '@hypery/auth';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ImageDisplayProps {
  imageId: string;
}

interface ImageData {
  _id: string;
  prompt: string;
  model: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  images: Array<{ url: string } | string>;
  error?: string;
  cost?: number;
  duration?: number;
}

export function ImageDisplay({ imageId }: ImageDisplayProps) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useHyperyAuth();

  const fetchImageStatus = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const aiGatewayUrl = process.env.NEXT_PUBLIC_AI_GATEWAY_URL || 'http://localhost:3001';
      const response = await fetch(`${aiGatewayUrl}/api/v1/images/${imageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const data = await response.json();
      setImageData(data.image);
      setLoading(false);

      // If still processing, poll again in 2 seconds
      if (data.image.status === 'pending' || data.image.status === 'processing') {
        setTimeout(fetchImageStatus, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImageStatus();
  }, [imageId]);

  if (loading && !imageData) {
    return (
      <div className="flex items-center space-x-2 text-[var(--accent-primary)] bg-blue-50 p-3 rounded-lg border border-blue-200">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading image...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
        <XCircle className="w-4 h-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!imageData) {
    return null;
  }

  const status = imageData.status;
  const images = imageData.images || [];
  const imageUrl = images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0].url) : null;

  if (status === 'succeeded' && imageUrl) {
    return (
      <div className="bg-gray-50 rounded-lg border border-[var(--border-secondary)] overflow-hidden">
        <img 
          src={imageUrl} 
          alt={imageData.prompt}
          className="w-full max-w-lg rounded-lg"
          loading="lazy"
        />
        <div className="p-3 text-xs text-[var(--text-disabled)] space-y-1">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="font-medium">Generated successfully</span>
          </div>
          <div><strong>Prompt:</strong> {imageData.prompt}</div>
          <div><strong>Model:</strong> {imageData.model}</div>
          {imageData.cost !== undefined && <div><strong>Cost:</strong> ${imageData.cost.toFixed(4)}</div>}
          {imageData.duration !== undefined && <div><strong>Duration:</strong> {imageData.duration}s</div>}
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
        <XCircle className="w-4 h-4" />
        <div className="text-sm">
          <div className="font-medium">Generation failed</div>
          {imageData.error && <div className="text-xs mt-1">{imageData.error}</div>}
        </div>
      </div>
    );
  }

  // Still processing
  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-2">
      <div className="flex items-center space-x-2 text-[var(--accent-primary)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Generating image...</span>
      </div>
      <div className="text-xs text-[var(--text-disabled)] space-y-1">
        <div><strong>Status:</strong> {status}</div>
        <div><strong>Prompt:</strong> {imageData.prompt}</div>
        <div><strong>Model:</strong> {imageData.model}</div>
      </div>
      <button
        onClick={fetchImageStatus}
        className="flex items-center space-x-1 text-xs text-[var(--accent-primary)] hover:text-blue-700"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Refresh</span>
      </button>
    </div>
  );
}




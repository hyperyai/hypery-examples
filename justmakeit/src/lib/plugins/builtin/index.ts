/**
 * Built-in Plugins
 * Export all bundled plugins
 */

export { imageViewerPlugin, imageEditorPlugin } from './image-plugin';
export { model3DViewerPlugin } from './model3d-plugin';
export { audioViewerPlugin } from './audio-plugin';

import { imageViewerPlugin, imageEditorPlugin } from './image-plugin';
import { model3DViewerPlugin } from './model3d-plugin';
import { audioViewerPlugin } from './audio-plugin';
import type { Plugin } from '../types';

/**
 * All built-in plugins
 */
export const builtinPlugins: Plugin[] = [
  imageViewerPlugin,
  imageEditorPlugin,
  model3DViewerPlugin,
  audioViewerPlugin,
];


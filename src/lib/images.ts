import type { ImageSourcePropType } from 'react-native';

/**
 * Static registry: Metro needs literal require() paths, so the 16 story
 * panels extracted from the legacy stack are listed explicitly.
 */
export const STORY_IMAGES: Record<string, ImageSourcePropType> = {
  'page-01': require('../../assets/story/page-01.jpg'),
  'page-02': require('../../assets/story/page-02.jpg'),
  'page-03': require('../../assets/story/page-03.jpg'),
  'page-04': require('../../assets/story/page-04.jpg'),
  'page-05': require('../../assets/story/page-05.jpg'),
  'page-06': require('../../assets/story/page-06.jpg'),
  'page-07': require('../../assets/story/page-07.jpg'),
  'page-08': require('../../assets/story/page-08.jpg'),
  'page-09': require('../../assets/story/page-09.jpg'),
  'page-10': require('../../assets/story/page-10.jpg'),
  'page-11': require('../../assets/story/page-11.jpg'),
  'page-12': require('../../assets/story/page-12.jpg'),
  'page-13': require('../../assets/story/page-13.jpg'),
  'page-14': require('../../assets/story/page-14.jpg'),
  'page-15': require('../../assets/story/page-15.jpg'),
  'page-16': require('../../assets/story/page-16.jpg'),
};

export function storyImage(key: string): ImageSourcePropType | undefined {
  return STORY_IMAGES[key];
}

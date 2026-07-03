import {
  loadMostRecentProgress,
  syncData,
  loadProfileInfo,
  throttledSyncData,
  saveSeriesProgress
} from './js/sync-supabase.js';

import { onPlayEpisode } from './viewsTracker.js';
import { supabase } from './js/sync-supabase.js';
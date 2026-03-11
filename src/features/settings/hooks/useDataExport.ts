import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase/client';
import {
  generateWorkoutCSV,
  generatePlansCSV,
  generateBodyMetricsCSV,
  generatePRDataCSV,
  combineExportSections,
} from '@/features/settings/utils/csvExport';

export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        Alert.alert('Export Error', 'You must be signed in to export data.');
        return;
      }

      // Query all user data in parallel
      const [
        sessionsResult,
        plansResult,
        bodyweightResult,
        measurementsResult,
        baselinesResult,
      ] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*, session_exercises(*, set_logs(*), exercises:exercise_id(name))')
          .eq('user_id', userId)
          .order('started_at', { ascending: false }),
        supabase
          .from('plans')
          .select('*, plan_days(*, plan_day_exercises(*, exercises:exercise_id(name)))')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('bodyweight_logs')
          .select('*')
          .eq('user_id', userId)
          .order('logged_at', { ascending: false }),
        supabase
          .from('body_measurements')
          .select('*')
          .eq('user_id', userId)
          .order('logged_at', { ascending: false }),
        supabase
          .from('pr_baselines')
          .select('*, exercises:exercise_id(name)')
          .eq('user_id', userId),
      ]);

      // Generate CSV sections
      const sections = [
        { title: 'Workout Sessions', csv: generateWorkoutCSV(sessionsResult.data ?? []) },
        { title: 'Training Plans', csv: generatePlansCSV(plansResult.data ?? []) },
        { title: 'Body Metrics', csv: generateBodyMetricsCSV(bodyweightResult.data ?? [], measurementsResult.data ?? []) },
        { title: 'PR Baselines', csv: generatePRDataCSV(baselinesResult.data ?? []) },
      ];

      const combinedCSV = combineExportSections(sections);

      // Write to cache and share
      const fileUri = FileSystem.cacheDirectory + 'rpe-export.csv';
      await FileSystem.writeAsStringAsync(fileUri, combinedCSV);

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        UTI: 'public.comma-separated-values-text',
        dialogTitle: 'Export RPE Data',
      });
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'An error occurred while exporting your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportData, isExporting };
}

import type { CourseReturn } from '~/types/course';
import useFetchWithCache from '~/composables/useFetchWithCache';

export const useCourse = (courseSlug: string): Promise<Maybe<CourseReturn>> =>
  useFetchWithCache(`api/courses/${courseSlug}`);

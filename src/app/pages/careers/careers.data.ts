export interface Job {
  titleKey: string;
  tagKey: string;
  descKey: string;
}

/** Open positions on careers.html. To add a role, extend the range and add its job<N>_title/_tag/_desc keys (all 4 languages). */
export const JOBS: Job[] = [1, 2, 3, 4, 5].map((n) => ({
  titleKey: `job${n}_title`,
  tagKey: `job${n}_tag`,
  descKey: `job${n}_desc`,
}));

export const JOBS_EMAIL = 'jobs@mayfairtechexpertsolutions.com';

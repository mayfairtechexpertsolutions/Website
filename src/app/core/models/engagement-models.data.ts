import { EngagementModel } from './engagement-model.model';

export const ENGAGEMENT_MODELS: EngagementModel[] = [
  {
    icon: 'fa-user-shield',
    badgeKey: 'model1_badge',
    titleKey: 'model1_title',
    descKey: 'model1_desc',
    featureKeys: ['model1_li1', 'model1_li2', 'model1_li3'],
  },
  {
    icon: 'fa-users-rectangle',
    badgeKey: 'model2_badge',
    titleKey: 'model2_title',
    descKey: 'model2_desc',
    featureKeys: ['model2_li1', 'model2_li2', 'model2_li3'],
  },
  {
    icon: 'fa-flag-checkered',
    badgeKey: 'model3_badge',
    titleKey: 'model3_title',
    descKey: 'model3_desc',
    featureKeys: ['model3_li1', 'model3_li2', 'model3_li3'],
  },
];

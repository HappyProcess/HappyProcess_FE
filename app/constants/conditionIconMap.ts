export const CONDITION_ICON_INDEX_BY_NAME: Record<string, number> = {
  천식: 1,
  고혈압: 2,
  안구건조증: 3,
  햇빛알러지: 4,
  꽃가루알러지: 5,
  비염: 6,
  당뇨: 7,
  심장질환: 8,
  "피부염/아토피": 9,
  관절염: 10,
  뇌졸중: 11,
  어린이: 12,
  고령: 13,
};

export const getConditionIconIndex = (conditionName: string) =>
  CONDITION_ICON_INDEX_BY_NAME[conditionName] ?? 0;

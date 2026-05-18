export function filled(value) {
  return String(value ?? '').trim().length > 0;
}

export const STEP_VALIDATORS = {
  basics: (data) => filled(data.title) && filled(data.sport) && filled(data.type),
  player: (data) => filled(data.player),
  game: (data) => filled(data.usage),
  auth: (data) => filled(data.auth),
  photos: (data) => Array.isArray(data.images) && data.images.length > 0,
  price: (data) => filled(data.price) && filled(data.priceDate) && filled(data.source),
  visibility: (data) => filled(data.visibility) && (!data.forSale || filled(data.asking)),
  review: () => true,
};

export function isStepComplete(stepId, data) {
  const validate = STEP_VALIDATORS[stepId];
  return validate ? validate(data) : true;
}

export function canNavigateToStep(targetIdx, currentIdx, data, steps) {
  if (targetIdx <= currentIdx) return true;
  for (let i = 0; i < targetIdx; i += 1) {
    if (!isStepComplete(steps[i].id, data)) return false;
  }
  return true;
}

export function allStepsComplete(data, steps) {
  return steps.every((s) => isStepComplete(s.id, data));
}

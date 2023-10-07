import createTag from './tag.js';

// as the blocks are loaded in aysnchronously, we don't have a specific timing
// that the all blocks are loaded -> cannot use a single observer to
// observe all blocks, so use functions here in blocks instead
// eslint-disable-next-line max-len
const requireRevealWrapper = ['slide-reveal-up', 'slide-reveal-up-slow'];

export function addRevealWrapperToAnimationTarget(element) {
  const revealWrapper = createTag('div', { class: 'slide-reveal-wrapper' });
  const parent = element.parentNode;
  // Insert the wrapper before the element
  parent.insertBefore(revealWrapper, element);
  revealWrapper.appendChild(element);
}

// eslint-disable-next-line max-len
export function addAnimatedClassToElement(targetSelector, animatedClass, delayTime, targetSelectorWrapper) {
  const target = targetSelectorWrapper.querySelector(targetSelector);
  if (target) {
    target.classList.add(animatedClass);
    if (delayTime) target.style.transitionDelay = `${delayTime}s`;
    if (requireRevealWrapper.indexOf(animatedClass) !== -1) {
      addRevealWrapperToAnimationTarget(target);
    }
  }
}

export function addInviewObserverToTriggerElement(triggerElement) {
  const observerOptions = {
    threshold: 0.25, // show when is 25% in view
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  observer.observe(triggerElement);
}

// eslint-disable-next-line max-len
export function addInViewAnimationToSingleElement(targetElement, animatedClass, triggerElement, delayTime) {
  // if it's HTML element
  if (targetElement.nodeType === 1) {
    targetElement.classList.add(animatedClass);
    if (requireRevealWrapper.indexOf(animatedClass) !== -1) {
      addRevealWrapperToAnimationTarget(targetElement);
    }
  }
  // if it's string only, which should be a selector
  if (targetElement.nodeType === 3) {
    addAnimatedClassToElement(targetElement, animatedClass, triggerElement, delayTime);
  }
  const trigger = triggerElement || targetElement;
  addInviewObserverToTriggerElement(trigger);
}

export default {
  addInViewAnimationToSingleElement,
};

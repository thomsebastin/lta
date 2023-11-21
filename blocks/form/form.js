import { addInViewAnimationToSingleElement } from '../../utils/helpers.js';
import xml2json from '../../utils/xml2json.js';

function createSelect(fd) {
  const select = document.createElement('select');
  select.id = fd.Field;
  if (fd.Placeholder) {
    const ph = document.createElement('option');
    ph.textContent = fd.Placeholder;
    ph.setAttribute('selected', '');
    ph.setAttribute('disabled', '');
    select.append(ph);
  }
  fd.Options.split(',').forEach((o) => {
    const option = document.createElement('option');
    option.textContent = o.trim();
    option.value = o.trim();
    select.append(option);
  });
  if (fd.Mandatory === 'x') {
    select.setAttribute('required', 'required');
  }
  return select;
}

function constructPayload(form) {
  const payload = {};
  [...form.elements].forEach((fe) => {
    if (fe.type === 'checkbox') {
      if (fe.checked) payload[fe.id] = fe.value;
    } else if (fe.id) {
      payload[fe.id] = fe.value;
    }
  });
  return payload;
}

function parseXml(xml) {
  let dom = null;

  if (window.DOMParser) {
    try {
      dom = new DOMParser().parseFromString(xml, 'text/xml');
    } catch (e) {
      dom = null;
    }
  } else {
    throw new Error('Cannot parse xml string!');
  }

  return dom;
}

// AIzaSyC1ay5Vr4QzEGUSTbA5re9Nux-Kza-z7OQ
async function fetchPageSpeedScore(url) {
  const apiKey = 'AIzaSyC1ay5Vr4QzEGUSTbA5re9Nux-Kza-z7OQ'; // Replace with your PageSpeed Insights API key
  const urlToTest = url || 'https://www.palladiumhotelgroup.com/es';
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${urlToTest}&key=${apiKey}&category=performance&category=accessibility&category=seo&category=best-practices`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching PageSpeed data:', error);
    return error;
  }
}

function decorateScore(scores, el) {
  const scoreEl = document.createElement('div');
  scoreEl.classList.add('score-el');

  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(scores)) {
    const scoreDiv = document.createElement('div');
    scoreDiv.classList.add('score');
    scoreDiv.innerHTML = `<span class='score-key'>${key}:</span> <span class='score-val'>${value}</span>`;
    scoreEl.append(scoreDiv);
  }

  el.append(scoreEl);
}

function renderScores(res) {
  const main = document.querySelector('main');
  const scoreContainer = document.createElement('div');
  scoreContainer.classList.add('score-container');
  main.append(scoreContainer);

  if (!Object.prototype.hasOwnProperty.call(res, 'error')) {
    const data = res;
    const scores = {
      Url: data.id,
      Performance: data.lighthouseResult.categories.performance.score * 100,
      Accessibility: data.lighthouseResult.categories.accessibility.score * 100,
      BestPractices: data.lighthouseResult.categories['best-practices'].score * 100,
      SEO: data.lighthouseResult.categories.seo.score * 100,
    };
    decorateScore(scores, scoreContainer);
  }
}

function initLoader(total) {
  const mainEl = document.querySelector('main');
  const loaderEl = document.createElement('div');
  loaderEl.innerText = `Fetching pagespeed results...0/${total}`;
  loaderEl.classList.add('score-loader');
  mainEl.append(loaderEl);
}

function hideLoader() {
  const loaderEl = document.querySelector('.score-loader');
  if (loaderEl) loaderEl.classList.add('hide');
}

function updateLoader(done, total) {
  const loaderEl = document.querySelector('.score-loader');
  loaderEl.innerText = `Fetching pagespeed results...${done}/${total}`;
}

async function submitForm(form) {
  const payload = constructPayload(form);
  payload.timestamp = new Date().toJSON();
  // my code starts here. Refactor once functionality is done
  const resp = await fetch('../utils/sitemap.xml');
  const res = await resp.text();
  const dom = parseXml(res);
  const json = xml2json(dom, '');
  const nodes = JSON.parse(json).urlset.url;
  initLoader(nodes.length);
  let done = 0;

  Promise.all(nodes.map(async ({ loc }) => {
    const result = await fetchPageSpeedScore(loc);
    updateLoader(done += 1, nodes.length);
    renderScores(result);
  })).then(() => {
    hideLoader();
  });
}

function createButton(fd) {
  const button = document.createElement('button');
  button.textContent = fd.Label;
  button.classList.add('button');
  if (fd.Type === 'submit') {
    button.addEventListener('click', async (event) => {
      const form = button.closest('form');
      if (fd.Placeholder) form.dataset.action = fd.Placeholder;
      if (form.checkValidity()) {
        event.preventDefault();
        button.setAttribute('disabled', '');
        await submitForm(form);
      }
    });
  }
  return button;
}

function createHeading(fd, el) {
  const heading = document.createElement(el);
  heading.textContent = fd.Label;
  return heading;
}

function createInput(fd) {
  const input = document.createElement('input');
  input.type = fd.Type;
  input.id = fd.Field;
  input.setAttribute('placeholder', fd.Placeholder);
  if (fd.Mandatory === 'x') {
    input.setAttribute('required', 'required');
  }
  return input;
}

function createTextArea(fd) {
  const input = document.createElement('textarea');
  input.id = fd.Field;
  input.setAttribute('placeholder', fd.Placeholder);
  if (fd.Mandatory === 'x') {
    input.setAttribute('required', 'required');
  }
  return input;
}

function createLabel(fd) {
  const label = document.createElement('label');
  label.setAttribute('for', fd.Field);
  label.textContent = fd.Label;
  if (fd.Mandatory === 'x') {
    label.classList.add('required');
  }
  return label;
}

function applyRules(form, rules) {
  const payload = constructPayload(form);
  rules.forEach((field) => {
    const { type, condition: { key, operator, value } } = field.rule;
    if (type === 'visible') {
      if (operator === 'eq') {
        if (payload[key] === value) {
          form.querySelector(`.${field.fieldId}`).classList.remove('hidden');
        } else {
          form.querySelector(`.${field.fieldId}`).classList.add('hidden');
        }
      }
    }
  });
}

function fill(form) {
  const { action } = form.dataset;
  if (action === '/tools/bot/register-form') {
    const loc = new URL(window.location.href);
    form.querySelector('#owner').value = loc.searchParams.get('owner') || '';
    form.querySelector('#installationId').value = loc.searchParams.get('id') || '';
  }
}

async function createForm(formURL) {
  const { pathname } = new URL(formURL);
  const resp = await fetch(pathname);
  const json = await resp.json();
  const form = document.createElement('form');
  const rules = [];
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = pathname.split('.json')[0];
  json.data.forEach((fd) => {
    fd.Type = fd.Type || 'text';
    const fieldWrapper = document.createElement('div');
    const style = fd.Style ? ` form-${fd.Style}` : '';
    const fieldId = `form-${fd.Type}-wrapper${style}`;
    fieldWrapper.className = fieldId;
    fieldWrapper.classList.add('field-wrapper');
    switch (fd.Type) {
      case 'select':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createSelect(fd));
        break;
      case 'heading':
        fieldWrapper.append(createHeading(fd, 'h3'));
        break;
      case 'legal':
        fieldWrapper.append(createHeading(fd, 'p'));
        break;
      case 'checkbox':
        fieldWrapper.append(createInput(fd));
        fieldWrapper.append(createLabel(fd));
        break;
      case 'text-area':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createTextArea(fd));
        break;
      case 'submit':
        fieldWrapper.append(createButton(fd));
        break;
      default:
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createInput(fd));
    }

    if (fd.Rules) {
      try {
        rules.push({ fieldId, rule: JSON.parse(fd.Rules) });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Invalid Rule ${fd.Rules}: ${e}`);
      }
    }
    form.append(fieldWrapper);
  });

  form.addEventListener('change', () => applyRules(form, rules));
  applyRules(form, rules);
  fill(form);
  return (form);
}

export default async function decorate(block) {
  const form = block.querySelector('a[href$=".json"]');
  addInViewAnimationToSingleElement(block, 'fade-up');
  if (form) {
    form.replaceWith(await createForm(form.href));
  }
}

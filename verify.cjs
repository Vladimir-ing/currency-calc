const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);

const elements = new Map();
function get(id) {
  if (!elements.has(id)) elements.set(id, {
    value: id === 'amountFrom' ? '92500' : '',
    listeners: {}, classList: { add() {}, remove() {} },
    setAttribute() {}, replaceChildren() { this.options = []; },
    append(option) { this.options.push(option); },
    addEventListener(name, callback) { this.listeners[name] = callback; },
  });
  return elements.get(id);
}
const document = {
  documentElement: {}, title: '', getElementById: get,
  createElement() { return {}; }, querySelectorAll() { return []; },
  querySelector() { return { setAttribute() {} }; },
};
const window = { addEventListener() {} };
const context = vm.createContext({ document, window, navigator: { onLine: false }, location: { protocol: 'file:' }, console, Intl, Date, Number, Object, String, Error });
vm.runInContext(script, context);
assert.equal(get('amountTo').value.replace(/\s/g, ''), '1145150');
assert.match(get('status').textContent, /Резервный курс/);
get('amountTo').value = '1 238';
get('amountTo').listeners.input();
assert.equal(get('amountFrom').value, '100');
get('langEn').listeners.click();
assert.equal(document.title, 'Currency Calculator');
get('amountTo').value = '1,234,567.89';
get('amountTo').listeners.input();
assert.equal(get('amountFrom').value, '99,722.77');
get('swap').listeners.click();
assert.equal(get('currencyFrom').value, 'RUB');
assert.equal(get('currencyTo').value, 'CNY');
console.log('Проверки расчёта, офлайна, языка и обмена пройдены');

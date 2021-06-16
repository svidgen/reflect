const reflect = require('../lib');

QUnit.module('reflect');

QUnit.test("can mirror existing object properties", assert => {
	const source = {a: 123};
	const target = {};

	const mirror = reflect(source).onto(target);
	source.a += 1;

	assert.equal(source.a, 124);
	assert.equal(target.a, 124);
});

QUnit.test("can mirror multiple properties", assert => {
	const source = {a: 123, b: 456};
	const target = {};

	const mirror = reflect(source).onto(target);
	source.a++;
	source.b++;

	assert.equal(source.a, 124);
	assert.equal(source.b, 457);
	assert.equal(target.a, 124);
	assert.equal(target.b, 457);
});

QUnit.test("can auto-register target props not-yet-existent on source for mirroring", assert => {
	const source = {};
	const target = {a: 'default'};

	const mirror = reflect(source).onto(target);
	source.a = 'asdf';

	assert.equal(source.a, 'asdf');
	assert.equal(target.a, 'asdf');
});

QUnit.test("can mirror not-yet-existing properties when explicitly requested", assert => {
	const source = {};
	const target = {};

	const mirror = reflect(source, ['a']).onto(target);
	source.a = 123;

	assert.equal(source.a, 123);
	assert.equal(target.a, 123);
});

QUnit.test("can mirror to multiple targets", assert => {
	const source = {};
	const target1 = {};
	const target2 = {};

	const mirror1 = reflect(source, ['a']).onto(target1);
	const mirror2 = reflect(source, ['a']).onto(target2);
	source.a = 'abc';

	assert.equal(source.a, 'abc');
	assert.equal(target1.a, 'abc');
	assert.equal(target2.a, 'abc');
});

QUnit.test("can mirror properties to functions", assert => {
	const source = {};
	const target = { a: v => { target._calledWith = v; } };

	const mirror = reflect(source, ['a']).onto(target);
	source.a = 'abc';

	assert.equal(source.a, 'abc');
	assert.equal(target._calledWith, 'abc');
	assert.equal(typeof target.a, 'function', "the monitoring function should not be tampered with");
});

QUnit.test("can mirror functions to functions", assert => {
	const source = { a: v => {} };
	const target = { a: function(v) { this._calledWith = v; } };

	const mirror = reflect(source).onto(target);
	source.a('abc');

	assert.equal(typeof source.a, 'function', "a() should still be intact as a function on the source");
	assert.equal(typeof target.a, 'function', "a() should still be intact as a function on the target");
	assert.equal(target._calledWith, 'abc');
});

QUnit.test("can mirror functions args to properties", assert => {
	const source = {a: v => {}};
	const target = {};

	const mirror = reflect(source).onto(target);
	source.a('abc', 'xyz');

	assert.equal(typeof source.a, 'function', "source.a should still be a function");
	assert.equal(typeof target.a, 'object', "target.b should be an object (array)");
	assert.ok(target.a instanceof Array, "target.b should be an [args] array");
	assert.equal(target.a.length, 2, "target.a length should match args length");
	assert.equal(target.a[0], 'abc');
	assert.equal(target.a[1], 'xyz');
});

QUnit.test("provides a shatterable mirror", assert => {
	const source = {};
	const target = {a: 'default', b: v => { target._b = v; } };

	const mirror = reflect(source).onto(target);
	source.a = 'a value';
	source.b = 'b value';

	assert.equal(target.a, 'a value');
	assert.equal(target._b, 'b value');

	mirror.shatter();
	source.a = 'new a value';
	source.b = 'new b value';

	assert.equal(target.a, 'a value');
	assert.equal(target._b, 'b value');
});

QUnit.test("gives target default values from source", assert => {
	const source = {a: 'default a'};
	const target = {};

	const mirror = reflect(source).onto(target);

	assert.equal(target.a, 'default a');
});

QUnit.test("initializes array mirrors", assert => {
	const source = [1,2,3];
	const target = [];

	const mirror = reflect(source).onto(target);

	const expected = JSON.stringify([1,2,3]);
	assert.equal(JSON.stringify(source), expected);
	assert.equal(JSON.stringify(target), expected);
});

QUnit.test("mirrors array push", assert => {
	const source = [];
	const target = [];

	const mirror = reflect(source).onto(target);
	source.push(123);

	assert.equal(target[0], 123);
});

QUnit.test("mirrors array pop", assert => {
	const source = [1,2,3,4];
	const target = [];

	const mirror = reflect(source).onto(target);
	const popped = source.pop();

	const expected = JSON.stringify([1,2,3]);
	assert.equal(JSON.stringify(source), expected);
	assert.equal(JSON.stringify(target), expected);
	assert.equal(popped, 4);
});

QUnit.test("mirrors array unshift", assert => {
	const source = [2,3];
	const target = [];

	const mirror = reflect(source).onto(target);
	source.unshift(1);

	const expected = JSON.stringify([1,2,3]);
	assert.equal(JSON.stringify(source), expected);
	assert.equal(JSON.stringify(target), expected);
});

QUnit.test("mirrors array shift", assert => {
	const source = [0,1,2,3];
	const target = [];

	const mirror = reflect(source).onto(target);
	source.shift();

	const expected = JSON.stringify([1,2,3]);
	assert.equal(JSON.stringify(source), expected);
	assert.equal(JSON.stringify(target), expected);
});

QUnit.test("mirrors array splice", assert => {
	const source = [1,1,2,3];
	const target = [];

	const mirror = reflect(source).onto(target);
	source.splice(1,1);

	const expected = JSON.stringify([1,2,3]);
	assert.equal(JSON.stringify(source), expected);
	assert.equal(JSON.stringify(target), expected);
});

QUnit.test("mirrors array splice with replacement", assert => {
	const source = [1,3];
	const target = [];

	const mirror = reflect(source).onto(target);
	source.splice(1,0,2);

	const expected = JSON.stringify([1,2,3]);
	assert.equal(JSON.stringify(source), expected);
	assert.equal(JSON.stringify(target), expected);
});

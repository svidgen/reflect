/*
 * Infects an object with a multi-cast property and method mirroring.
 *
 * ```
 * reflect(source, ['property_a', 'property_b', 'method_a']).onto(target);
 * ```
 * 
 * The `target` object will be invoked with the same calls/values as those
 * made against the `source` on the listed properties and methods -- or
 * ALL enumerable properties and methods if none are given.
 * 
 * The only way to stop mirroring is to shatter the mirror:
 * 
 * ```
 * let mirror = reflect(source).onto(target);
 * 
 * // later.
 * mirror.shatter();
 * ```
 *
 * Once an object is being reflected, regardless of whether it is being
 * actively mirrored, it is embedded with reflection hooks. This library does
 * not currently try to remove its hooks at any time.
 *
*/
function reflect(source, props) {
	if (typeof props === 'undefined') {
		props = allPropertyNamesOf(source);
	} else if (typeof props != 'Array') {
		props = [props];
	} else {
		props = distinct(props);
	}

	source.__callbacks = source.__callbacks || {};
	source.__targets = source.__targets || [];

	function registerProperty(p) {
		if (p === '__callbacks') return;
		if (p === '__targets') return;
		if (typeof source.__callbacks[p] === 'function') return;

		source.__callbacks[p] = callback(source, p);
		if (typeof source[p] === 'function') {
			const _originalFunction = source[p].bind(source);
			source[p] = (...args) => {
				try {
					const rv = _originalFunction(...args);
					source.__callbacks[p](...args);
					return rv;
				} catch (err) {
					throw err;
				}
			};
		} else {
			var innerValue = source[p];
			try {
				Object.defineProperty(source, p, {
					set: function(v) {
						innerValue = v;
						source.__callbacks[p](v);
					},
					get: function() {
						return innerValue;
					}
				});
			} catch (err) {
				console.warn(`Cannot mirror property '${p}'`);
			}
		}
	};

	function initialize(target) {
		const allProps = distinct([
			...allPropertyNamesOf(source),
			...allPropertyNamesOf(target)
		]);
		allProps.forEach(p => {
			if (p === '__callbacks') return;
			if (p === '__targets') return;
			if (typeof source[p] !== 'function') {
				// small, inefficient cheat: create a new callback, scoped to
				// the target and execute it with existing value.
				callback(source, p, target)(source[p]);
			}
		});
		if (source instanceof Array && target instanceof Array) {
			target.splice(0);
			source.forEach((item, index) => target[index] = item);
		}
	};

	props.forEach(p => registerProperty(p));

	return {
		onto: target => {
			const targetProps = allPropertyNamesOf(target);
			targetProps.forEach(p => registerProperty(p));
			source.__targets.indexOf(target) < 0 && source.__targets.push(target);
			initialize(target);
			return {
				shatter: () => {
					source.__targets.splice(source.__targets.indexOf(target), 1);
				}
			};
		}
	};
};

function callback(source, name, target) {
	return (...args) => {
		(target ? [target] : source.__targets).forEach(target => {
			try {
				if (typeof target[name] === 'function') {
					target[name](...args);
				} else {
					if (typeof source[name] === 'function') {
						target[name] = args;
					} else {
						target[name] = args[0];
					}
				}
			} catch (err) {
				console.error(`${err}: Could not invoke ${name} on target`);
				console.log('target =', target);
			}
		});
	};
};

function distinct(items) {
	return [...(new Set([...items]))];
};

function allPropertyNamesOf(o) {
	var isArray = o instanceof Array;
	var props = Object.getOwnPropertyNames(o);
	for (; o != null; o = Object.getPrototypeOf(o)) {
		props = [...props, ...Object.getOwnPropertyNames(o)];
	}
	if (isArray) {
		props = props.filter(p => p !== 'length' && Number.isNaN(Number(p)));
	}
	return distinct(props);
};

module.exports = reflect;

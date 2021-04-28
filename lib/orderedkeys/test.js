const assert = require('assert');
const orderedKeys = require('./index')
const fc = require('fast-check');

describe("OrderedKeys", () => {

    it("has lexicographically sorted characters", () => {
        assert.strictEqual(orderedKeys.chars, orderedKeys.chars.sort())
    })

    it("correctly converts to and from a number", () => {
        fc.assert(fc.property(fc.integer(), (input) => {
            let key = orderedKeys.encode(Math.abs(input))
            let output = orderedKeys.decode(key)
            return Math.abs(input) === output
        }))
    })

    it("preserves order", () => {
        fc.assert(fc.property(fc.integer(), fc.integer(), fc.integer(), (a, b, c) => {
            a = Math.min(Math.abs(a), Math.pow(2, 53) - 1)
            b = Math.min(Math.abs(b), Math.pow(2, 53) - 1)
            c = Math.min(Math.abs(c), Math.pow(2, 53) - 1)
            let input = [a, b, c].sort((a, b) => a - b)
            let keys = input.map((value) => { return orderedKeys.encode(value)})
            keys.sort()
            let output = keys.map((value) => { return orderedKeys.decode(value)})
            for (let i = 0; i < 3; i++) {
                assert.strictEqual(input[i], output[i], "input and output mismatch at " + i)
            }
        }))

    })
})
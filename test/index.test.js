/* eslint-disable no-undef */
import { expect } from 'chai';
import getVariables from '../src/get-variables';
import parseVariables from '../src/parse-variables';

context('without comments', () => {
  const sass = '$gray-base: #000 !default;\n$gray-darker: lighten($gray-base, 13.5%) !default; // #222\n$gray-dark: lighten($gray-base, 20%) !default;  // #333\n$gray:  lighten($gray-base, 33.5%) !default; // #555\n$gray-light:  lighten($gray-base, 46.7%) !default; // #777\n$gray-lighter:  lighten($gray-base, 93.5%) !default; // #eee';
  const variables = getVariables(sass);

  describe('getVariables()', () => {
    it('should return an array with 6 items', () => {
      expect(variables).to.be.a('array');
      expect(variables).to.have.length(6);
    });
  });

  describe('parseVariables()', () => {
    it('should return an object with the key grayBase', () => {
      const result = parseVariables(variables);
      expect(result).to.be.a('object');
      expect(result).to.include.keys('grayBase');
    });
  });

  describe('parseVariables({ preserveVariableNames: true })', () => {
    it('should return an object with the key gray-base', () => {
      const result = parseVariables(variables, { preserveVariableNames: true });
      expect(result).to.be.a('object');
      expect(result).to.include.keys('gray-base');
    });
  });
});

context('with comments', () => {
  const sass = `$one: 123;
$x: $one;
// $y: $two; // ERROR - $two not existed, but it's commented`;
  const variables = getVariables(sass);

  describe('getVariables()', () => {
    it('should return an array with 2 items', () => {
      expect(variables).to.be.a('array');
      expect(variables).to.have.length(2);
    });
  });

  describe('parseVariables()', () => {
    it('should return an object with the key one', () => {
      const result = parseVariables(variables);
      expect(result).to.be.a('object');
      expect(result).to.include.keys('one');
    });
    it('should not return an object with the key y', () => {
      const result = parseVariables(variables);
      expect(result).to.be.a('object');
      expect(result).to.not.include.keys('y');
    });
  });
});

context('with maps', () => {
  const sass = '$red: red; $my-map: (red: $red, white: #FFF);';
  const variables = getVariables(sass);

  describe('getVariables()', () => {
    it('should return an array with 2 items', () => {
      expect(variables).to.be.a('array');
      expect(variables).to.have.length(2);
      expect(variables[0].value).to.be.a('string');
      expect(variables[1].value).to.be.a('object');
    });
  });

  describe('parseVariables()', () => {
    it('should return an object with the key one', () => {
      const result = parseVariables(variables);
      expect(result).to.be.a('object');
      expect(result).to.include.keys('myMap');
    });
    it('should not return an object with the key y', () => {
      const result = parseVariables(variables);
      expect(result).to.be.a('object');
      expect(result).to.not.include.keys('y');
    });
    it('the myMap key should have an object value', () => {
      const result = parseVariables(variables);
      expect(result.myMap.red).to.equal('red');
      expect(result.myMap.white).to.equal('#FFF');
    });
    it('the red key should have an string value', () => {
      const result = parseVariables(variables);
      expect(result.red).to.equal('red');
    });
  });
});

context('empty sass-file', () => {
  describe('getVariables()', () => {
    function testFn() {
      const sass = '';
      return parseVariables(getVariables(sass));
    }

    it('should not throw', () => {
      expect(testFn).to.not.throw(TypeError);
    });

    it('should be an empty object', () => {
      const variables = testFn();
      expect(variables).to.be.a('object');
      expect(Object.keys(variables)).to.have.length(0);
    });
  });
});

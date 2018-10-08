'use strict';

const assert     = require('assert');
const expect     = require('chai').expect;
const should     = require('chai').should;
const loopback   = require('loopback');
const Promise    = require('bluebird');
const supertestp = require('supertest-as-promised');


const ChangesHistoryMixin = require('../');

const api    = supertestp('http://localhost:8000');
const app    = module.exports = loopback();
const ds     = loopback.createDataSource('memory');

const Product = ds.createModel('Product', {
  price:       'number',
  amount:      'number',
  Description: 'string',
});

ChangesHistoryMixin(Product, {
  fields:             [
    'price',
    'amount',
  ],
  modelName:          'ProductoChanges',
  versionFieldName:   'version',
  actionFieldName:    'lastAction',
  hashFieldName:      'verionHas',
  updatedFieldName:   'updatedAt',
  relationName:       'changes',
  relationForeignKey: 'productId',
  relationParentName: 'product',
});

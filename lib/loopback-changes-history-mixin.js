'use strict';

const md5 = require('md5');

module.exports = function ChangesHistoryMixin (Model, bootOptions) {

  const options = Object.assign({
    fields:             [],
    modelName:          `${Model.modelName.toLowerCase()}_history`,
    relationName:       'history',
    relationParentName: '_record',
    relationForeignKey: '_recordId',
    // Optionals
    versionFieldName:   '_version',
    hashFieldName:      '_hash',
    actionFieldName:    '_action',
    updatedFieldName:   '_update',
  }, bootOptions);

  function assert(cond, code, str) {
    if (!cond) {
      const err = new Error(`${Model.modelName} loopback-allowed-properties-mixin: ${str}`);
      err.code = code;
      throw err;
    }
  }

  assert(Array.isArray(options.fields), 'fieldMustBeAndArray', 'fields must be an array');
  assert(options.fields.length>0, 'fieldMustHaveAtLeastAElement', 'fields must have at least a element');
  assert(typeof options.modelName === 'string', 'modelNameMusbBeAString', 'modelName must be a string');
  assert(typeof options.relationName === 'string', 'relationNameMustBeAString', 'relationName must be a string');
  assert(typeof options.relationForeignKey === 'string', 'relationForeignKeyMustBeAString', 'relationForeignKey must be a string');
  assert(typeof options.relationParentName === 'string', 'relationParentNameMustBeAString', 'relationParentName must be a string');
  assert(typeof options.versionFieldName === 'string', 'versionFieldNameMustBeAString', 'versionFieldName must be a string');
  assert(options.hashFieldName === false || typeof options.hashFieldName === 'string', 'hashFieldNameMustBeAString', 'hashFieldName must be a string');
  assert(options.actionFieldName === false || typeof options.actionFieldName === 'string', 'actionFieldNameMustBeAString', 'actionFieldName must be a string');
  assert(options.updatedFieldName === false || typeof options.updatedFieldName === 'string', 'updatedFieldNameMustBeAString', 'updatedFieldName must be a string');

  function getNewVersion(data, isNewInstance) {
    const VERSION_LEN = 5;
    let version = data[options.versionFieldName] || '1';
    if (!isNewInstance) {
      version = parseInt(version) + 1;
    }
    version = ('0'.repeat(VERSION_LEN)+version).substr(-VERSION_LEN);
    return version;
  }

  function getVersioningData (instance, data = {}) {
    const versionedData = {};
    const dataRaw = instance.toJSON();
    options.fields.map((fieldName) => {
      versionedData[fieldName] = fieldName in data? data[fieldName] : dataRaw[fieldName];
    });
    return versionedData;
  }

  function getHash(versionedData) {
    return md5(JSON.stringify(versionedData));
  }

  Model.defineProperty(options.versionFieldName, { type: 'string' });

  if (options.hashFieldName) {
    Model.defineProperty(options.hashFieldName, { type: 'string' });
  }

  const HistoryModel = Model.dataSource.createModel(options.modelName);

  Model.forEachProperty((fieldName, opts) => {
    if(options.fields.indexOf(fieldName)===-1) return;
    HistoryModel.defineProperty(fieldName, {
      type: opts.type,
      required: options.required,
      dataType: opts.dataType,
    });
  });

  Model.app.model(HistoryModel);

  HistoryModel.defineProperty(options.versionFieldName, { type: 'string' });
  if (options.hashFieldName) {
    HistoryModel.defineProperty(options.hashFieldName, { type: 'string' });
  }
  if (options.actionFieldName) {
    HistoryModel.defineProperty(options.actionFieldName, { type: 'string' });
  }
  if (options.updatedFieldName) {
    HistoryModel.defineProperty(options.updatedFieldName, { type: 'date' });
  }

  HistoryModel.belongsTo(Model, {
    foreignKey: options.relationForeignKey,
    as:         options.relationParentName,
  });

  Model.hasMany(HistoryModel, {
    foreignKey: options.relationForeignKey,
    as:         options.relationName, 
  });

  Model.observe('before save', function (ctx) {
    return Promise.resolve()
    .then(() => {
      const data = ctx.instance || ctx.data;
      const instance = ctx.instance || ctx.currentInstance;
      if (!instance) return;
      const prevData = getVersioningData(instance);
      const values = getVersioningData(instance, data);
      if (options.hashFieldName) {
        const hash = getHash(values);
        if (instance[options.hashFieldName] !== hash) {
          data[options.hashFieldName] = hash;
          ctx.hookState.needNewVersion = !!options.versionFieldName;
        }
      } else {
        ctx.hookState.needNewVersion = true;
      }
      if (ctx.hookState.needNewVersion) {
        data[options.versionFieldName] = getNewVersion(instance, ctx.isNewInstance);
      }
    });
  });

  Model.observe('after save', function (ctx) {
    return Promise.resolve()
    .then(() => {
      if (ctx.hookState.needNewVersion) {
        const instance = ctx.instance;
        const versionedData = getVersioningData(instance);
        versionedData[options.versionFieldName] = instance[options.versionFieldName];
        if (options.actionFieldName) {
          versionedData[options.actionFieldName] = ctx.isNewInstance? 'create' : 'update';
        }
        if (options.hashFieldName) {
          versionedData[options.hashFieldName] = instance[options.hashFieldName];
        }
        if (options.updatedFieldName) {
          versionedData[options.updatedFieldName] = new Date();
        }
        return ctx.instance[options.relationName].create(versionedData)
        .then((version) => {
          Model.emit('version.record.created', { version, instance });
        });
      }
    });
  });

};
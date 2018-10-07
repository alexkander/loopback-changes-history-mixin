'use strict';

const md5 = require('md5');

module.exports = function (Model, bootOptions) {

  const options = Object.assign({
    fields:             [],
    modelName:          `${Model.modelName.toLowerCase()}_history`,
    versionFieldName:   '_version',
    actionFieldName:    '_action',
    hashFieldName:      '_hash',
    updatedFieldName:   '_update',
    relationName:       'history',
    relationForeignKey: '_recordId',
    relationParentName: '_record',
  }, bootOptions);

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

  if (options.versionFieldName) {
    Model.defineProperty(options.versionFieldName, { type: 'string' });
  }

  if (options.hashFieldName) {
    Model.defineProperty(options.hashFieldName, { type: 'string' });
  }

  const HistoryModel = Model.dataSource.define(options.modelName);

  Model.forEachProperty((fieldName, opts) => {
    if(options.fields.indexOf(fieldName)===-1) return;
    HistoryModel.defineProperty(fieldName, {
      type: opts.type,
      required: options.required,
      dataType: opts.dataType,
    });
  });

  if (options.versionFieldName) {
    HistoryModel.defineProperty(options.versionFieldName, { type: 'string' });
  }
  if (options.actionFieldName) {
    HistoryModel.defineProperty(options.actionFieldName, { type: 'string' });
  }
  if (options.hashFieldName) {
    HistoryModel.defineProperty(options.hashFieldName, { type: 'string' });
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
      if (options.hashFieldName) {
        const hash = getHash(getVersioningData(instance, data));
        if (instance[options.hashFieldName] !== hash) {
          data[options.hashFieldName] = hash;
          ctx.hookState.needNewVersion = !!options.versionFieldName;
        }
      } else {
        ctx.hookState.needNewVersion = !!options.versionFieldName;
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
        if (options.actionFieldName) {
          versionedData[options.actionFieldName] = ctx.isNewInstance? 'create' : 'update';
        }
        if (options.hashFieldName) {
          versionedData[options.hashFieldName] = instance[options.hashFieldName];
        }
        if (options.versionFieldName) {
          versionedData[options.versionFieldName] = instance[options.versionFieldName];
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
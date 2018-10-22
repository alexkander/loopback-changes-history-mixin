'use strict';

const md5 = require('md5');

function getVersion(len, number) {
  return ('0'.repeat(len)+number.toString()).substr(-len);
}

const DEFAULT_OPTS = {
  fields:             '*',
  relationName:       'history',
  relationParentName: '_record',
  relationForeignKey: '_recordId',
  versionFieldName:   '_version',
  versionFieldLen:    5,
  // Optionals
  hashFieldName:      '_hash',
  hashFieldLen:       10,
  actionFieldName:    '_action',
  updatedFieldName:   '_update',
};

module.exports = function ChangesHistoryMixin (Model, bootOptions) {

  const options = Object.assign({}, DEFAULT_OPTS, {
    modelName: `${Model.modelName}_history`,
  }, bootOptions);

  function assert(cond, code, str) {
    if (!cond) {
      const err = new Error(`${Model.modelName} loopback-allowed-properties-mixin: ${str}`);
      err.code = code;
      throw err;
    }
  }

  if (options.fields === '*') {
    options.fields = [];
    Model.forEachProperty((fieldName, opts) => {
      options.fields.push(fieldName);
    });
  }

  assert(Array.isArray(options.fields), 'fieldMustBeAndArray', 'fields must be an array');
  assert(options.fields.length>0, 'fieldMustHaveAtLeastAElement', 'fields must have at least a element');
  assert(typeof options.modelName === 'string', 'modelNameMusbBeAString', 'modelName must be a string');
  assert(typeof options.relationName === 'string', 'relationNameMustBeAString', 'relationName must be a string');
  assert(typeof options.relationForeignKey === 'string', 'relationForeignKeyMustBeAString', 'relationForeignKey must be a string');
  assert(typeof options.relationParentName === 'string', 'relationParentNameMustBeAString', 'relationParentName must be a string');
  assert(typeof options.versionFieldName === 'string', 'versionFieldNameMustBeAString', 'versionFieldName must be a string');
  assert(typeof options.versionFieldLen === 'number', 'versionFieldLenMustBeANumber', 'versionFieldLen must be a number');
  assert(options.hashFieldName === false || typeof options.hashFieldName === 'string', 'hashFieldNameMustBeAString', 'hashFieldName must be a string');
  if (options.hashFieldName !== false) {
    assert(typeof options.hashFieldLen === 'number', 'hashFieldLenMustBeANumber', 'hashFieldLen must be a numer');
  }
  assert(options.actionFieldName === false || typeof options.actionFieldName === 'string', 'actionFieldNameMustBeAString', 'actionFieldName must be a string');
  assert(options.updatedFieldName === false || typeof options.updatedFieldName === 'string', 'updatedFieldNameMustBeAString', 'updatedFieldName must be a string');
  
  const idFieldName = Model.getIdName();
  const historyFields = {};

  options.fields = options.fields.filter((fieldName) => fieldName !== idFieldName);

  function getNewVersion(data, isNewInstance) {
    let version = (data && data[options.versionFieldName]) || '1';
    if (data && !isNewInstance) {
      version = parseInt(version) + 1;
    }
    return getVersion(options.versionFieldLen, version);
  }

  function getVersioningData (instance, data = {}) {
    const versionedData = {};
    const dataRaw = (instance && instance.toJSON()) || {};
    options.fields.map((fieldName) => {
      versionedData[fieldName] = fieldName in data? data[fieldName] : dataRaw[fieldName];
    });
    return versionedData;
  }

  function getHash(versionedData) {
    return md5(JSON.stringify(versionedData)).substr(0, options.hashFieldLen);
  }

  Model.forEachProperty((fieldName, opts) => {
    if(options.fields.indexOf(fieldName) === -1) return;
    historyFields[fieldName] = {
      type: opts.type,
      required: options.required,
      dataType: opts.dataType,
    };
  });

  historyFields[options.versionFieldName] = { type: 'string', length: options.versionFieldLen };

  if (options.hashFieldName) {
    historyFields[options.hashFieldName] = { type: 'string', length: options.hashFieldLen };
    Model.defineProperty(options.hashFieldName, { type: 'string', length: options.hashFieldLen });
  }
  if (options.actionFieldName) {
    historyFields[options.actionFieldName] = { type: 'string' };
  }
  if (options.updatedFieldName) {
    historyFields[options.updatedFieldName] = { type: 'date' };
  }

  Model.defineProperty(options.versionFieldName, { type: 'string' });

  const HistoryModel = Model.dataSource.createModel(options.modelName, historyFields);

  Model.app.model(HistoryModel);

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
      const instance = ctx.instance || ctx.currentInstance;
      if (instance) return instance;
      if (ctx.where && ctx.options.instanceByWhere){
        return ctx.Model.findOne({ where: ctx.where});
      }
    })
    .then((instance) => {
      const data = ctx.instance || ctx.data;
      const values = getVersioningData(instance, data);
      if (options.hashFieldName) {
        if (options.actionFieldName) {
          values[options.actionFieldName] = ctx.isNewInstance? 'create' : 'update';
        }
        const hash = getHash(values);
        if (!instance || instance[options.hashFieldName] !== hash) {
          data[options.hashFieldName] = hash;
          ctx.hookState.needNewVersion = true;
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
      if (ctx.hookState.needNewVersion && !ctx.where) {
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

  Model.observe('before delete', function (ctx) {
    return Promise.resolve()
    .then(() => {
      if (ctx.instance) return ctx.instance;
      if (ctx.where && ctx.where[idFieldName]) {
        return ctx.Model.findById(ctx.where[idFieldName]);
      }
    })
    .then((instance) => {
      if (!instance) return;
      const values = getVersioningData(instance);
      if (options.actionFieldName) {
        values[options.actionFieldName] = 'delete';
      }
      if (options.hashFieldName) {
        values[options.hashFieldName] = getHash(values);
      }
      if (options.updatedFieldName) {
        values[options.updatedFieldName] = new Date();
      }
      values[options.relationForeignKey] = instance[idFieldName];
      ctx.hookState.values = values;
      ctx.hookState.instance = instance;

    });
  });

  Model.observe('after delete', function (ctx) {
    return Promise.resolve()
    .then(() => {
      if (!ctx.hookState.values) return;
      const {values, instance} = ctx.hookState;
      values[options.versionFieldName] = getNewVersion(instance);
      return HistoryModel.create(ctx.hookState.values)
      .then((version) => {
        Model.emit('version.record.created', { version, instance: ctx.hookState.instance });
      })
    });
  });

};

module.exports.getVersion = getVersion;
module.exports.DEFAULT_OPTS = DEFAULT_OPTS;
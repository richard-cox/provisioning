import { ClusterSaveHook, IClusterProvisioner, RegisterClusterSaveHook } from '@shell/core/types';

import { CAPI, DEFAULT_WORKSPACE } from '@shell/config/types';
import { CAPI as CAPI_LABELS } from '@shell/config/labels-annotations';
import { merge, set } from 'lodash';
import { normalizeName } from '@shell/utils/kube';

export class DigitalOceanProvisioner implements IClusterProvisioner {
  static origId = 'digitalocean';
  static ID = `${ DigitalOceanProvisioner.origId }example`;

  /* eslint-disable no-useless-constructor */
  constructor(private context: {
    dispatch: any,
    getters: any,
    axios: any,
    $plugin: any,
    $t: any,
    isCreate: boolean, // True if the cluster is being created, false if an existing cluster being edited
  }) {
  }

  get id(): String {
    return DigitalOceanProvisioner.ID;
  }

  get namespaced(): boolean {
    return false;
  }

  get icon(): any {
    return require('./icon.svg');
  }

  get machineConfigSchema(): { [key: string]: any } {
    const schema = `${ CAPI.MACHINE_CONFIG_GROUP }.${ DigitalOceanProvisioner.origId }config`;

    return this.context.getters['management/schemaFor'](schema);
  }

  async createMachinePoolMachineConfig(idx: number, pools: any, cluster: any) { // eslint-disable-line require-await
    this.debug('createMachinePoolMachineConfig', idx, pools, cluster);

    // Default - use the schema
    const config = await this.context.dispatch('management/createPopulated', {
      type:     this.machineConfigSchema.id,
      metadata: { namespace: DEFAULT_WORKSPACE }
    });

    // If there is no specific model, the applyDefaults does nothing by default
    config.applyDefaults(idx, pools);

    return config;
  }

  registerSaveHooks(registerBeforeHook: RegisterClusterSaveHook, registerAfterHook: RegisterClusterSaveHook, cluster: any): void {
    this.debug('registerSaveHooks', registerBeforeHook, registerAfterHook, cluster);

    registerBeforeHook(this.beforeSave, 'custom-before-hook', 99);
  }

  /**
   * Example of a function that will run in the before hook
   */
  async beforeSave(cluster: any) { // eslint-disable-line require-await
    this.debug('beforeHook', ...arguments);

    cluster.metadata.annotations = cluster.metadata.annotations || {};
    cluster.metadata.annotations[CAPI_LABELS.UI_CUSTOM_PROVIDER] = DigitalOceanProvisioner.ID;
  }

  async saveMachinePoolConfigs(machinePools: any[], cluster: any) { // eslint-disable-line require-await
    this.debug('saveMachinePoolConfigs', machinePools, cluster);

    const finalPools = [];

    for ( const entry of machinePools ) {
      if ( entry.remove ) {
        continue;
      }

      await this.syncMachineConfigWithLatest(entry);

      // Capitals and such aren't allowed;
      set(entry.pool, 'name', normalizeName(entry.pool.name) || 'pool');

      const prefix = `${ cluster.metadata.name }-${ entry.pool.name }`.substr(0, 50).toLowerCase();

      if ( entry.create ) {
        if ( !entry.config.metadata?.name ) {
          entry.config.metadata.generateName = `nc-${ prefix }-`;
        }

        const neu = await entry.config.save();

        entry.config = neu;
        entry.pool.machineConfigRef.name = neu.metadata.name;
        entry.create = false;
        entry.update = true;
      } else if ( entry.update ) {
        entry.config = await entry.config.save();
      }

      finalPools.push(entry.pool);
    }

    cluster.spec.rkeConfig.machinePools = finalPools;
  }

  /**
   * Example of a function that will save the underlying cluster resource
   *
   * Strictly speaking this isn't needed for this scenario, and is just a c&p of what would normally happen
   */
  async saveCluster(cluster: any): Promise<any> {
    this.debug('saveCluster', cluster);

    if ( this.context.isCreate ) {
      const schema = this.context.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);
      const url = schema.linkFor('collection');
      const res = await cluster.save({ url });

      if (res) {
        Object.assign(cluster, res);
      }
    } else {
      await cluster.save();
    }
  }

  get detailTabs() {
    return {
      machines:     true,
      logs:         true,
      registration: true,
      snapshots:    true,
      related:      true,
      events:       true,
      conditions:   true,
    };
  }

  async syncMachineConfigWithLatest(machinePool: any) {
    if (machinePool?.config?.id) {
      // Use management/request instead of management/find to avoid overwriting the current machine pool in the store
      const _latestConfig = await this.context.dispatch('management/request', { url: `/v1/${ machinePool.config.type }s/${ machinePool.config.id }` });
      const latestConfig = await this.context.dispatch('management/create', _latestConfig);

      const clonedCurrentConfig = await this.context.dispatch('management/clone', { resource: machinePool.config });
      const clonedLatestConfig = await this.context.dispatch('management/clone', { resource: latestConfig });

      // We don't allow the user to edit any of the fields in metadata from the UI so it's safe to override it with the
      // metadata defined by the latest backend value. This is primarily used to ensure the resourceVersion is up to date.
      delete clonedCurrentConfig.metadata;
      machinePool.config = merge(clonedLatestConfig, clonedCurrentConfig);
    }
  }

  private debug(...args: any[]) {
    console.debug('do provider', ...args, this.context);
  }
}

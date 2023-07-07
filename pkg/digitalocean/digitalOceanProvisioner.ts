import { ClusterSaveHook, IClusterProvisioner } from '@shell/core/types';

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
    $t: any
  }) { }

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

  // TODO: RC supply namespace
  async createMachinePoolMachineConfig(idx: number, pools: any) { // eslint-disable-line require-await
    console.warn('do provider', 'createMachinePoolMachineConfig', idx, pools); // TODO: RC debug

    // Default - use the schema
    const config = await this.context.dispatch('management/createPopulated', {
      type:     this.machineConfigSchema.id,
      metadata: { namespace: DEFAULT_WORKSPACE }
    });

    // If there is no specific model, the applyDefaults does nothing by default
    config.applyDefaults(idx, pools);

    return config;
  }

  registerSaveHooks(registerBeforeHook: ClusterSaveHook, registerAfterHook: ClusterSaveHook, cluster: any): void {
    registerBeforeHook(this.before, 'custom-before-hook');
  }

  /**
   * Example of a function that will run in the before hook
   */
  before(cluster: any) { //
    console.warn('do provider', 'beforeHook', ...arguments); // TODO: RC debug

    cluster.metadata.annotations = cluster.metadata.annotations || {};
    cluster.metadata.annotations[CAPI_LABELS.PROVIDER_UI] = DigitalOceanProvisioner.ID; // 'this' isn't this
  }

  async saveMachinePoolConfigs(machinePools: any[], cluster: any) { // eslint-disable-line require-await
    console.warn('do provider', 'saveMachinePoolConfigs', machinePools, cluster);

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

  // Returns an array of error messages or an empty array if provisioning was successful
  // async provision(cluster: any, pools: any) {
  //   const errors = [];

  //   // const isEditVersion = this.isEdit && this.liveValue?.spec?.kubernetesVersion !== this.value?.spec?.kubernetesVersion;
  //   // const hasPspManuallyAdded = !!this.value.spec.rkeConfig?.machineGlobalConfig?.['kube-apiserver-arg'];

  //   // if (isEditVersion && !this.needsPSP && hasPspManuallyAdded) {
  //   //   if (!await this.showPspConfirmation()) {
  //   //     return btnCb('cancelled');
  //   //   }
  //   // }

  //   // if (isEditVersion) {
  //   //   const shouldContinue = await this.showAddonConfirmation();

  //   //   if (!shouldContinue) {
  //   //     return btnCb('cancelled');
  //   //   }
  //   // }

  //   // if (this.value.cloudProvider === 'aws') {
  //   //   const missingProfileName = this.machinePools.some((mp) => !mp.config.iamInstanceProfile);

  //   //   if (missingProfileName) {
  //   //     this.errors.push(this.t('cluster.validation.iamInstanceProfileName', {}, true));
  //   //   }
  //   // }

  //   // TODO: RC would be nice to have this
  //   // for (const [index] of this.machinePools.entries()) { // validator machine config
  //   //   if ( typeof this.$refs.pool[index]?.test === 'function' ) {
  //   //     try {
  //   //       const res = await this.$refs.pool[index].test();

  //   //       if (Array.isArray(res) && res.length > 0) {
  //   //         this.errors.push(...res);
  //   //       }
  //   //     } catch (e) {
  //   //       this.errors.push(e);
  //   //     }
  //   //   }
  //   // }

  //   try {
  //     this.applyChartValues(cluster.spec.rkeConfig);
  //   } catch (err) {
  //     errors.push(err);

  //     return errors;
  //   }

  //   // Remove null profile on machineGlobalConfig - https://github.com/rancher/dashboard/issues/8480
  //   if (cluster.spec?.rkeConfig?.machineGlobalConfig?.profile === null) {
  //     delete cluster.spec.rkeConfig.machineGlobalConfig.profile;
  //   }

  //   await this.save(btnCb);
  // }

  // COPIED

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
}

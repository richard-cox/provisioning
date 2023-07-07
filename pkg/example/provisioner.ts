import { ClusterSaveHook, IClusterProvisioner } from '@shell/core/types';

import { CAPI } from '@shell/config/labels-annotations';

const RANCHER_CLUSTER = 'provisioning.cattle.io.cluster';

export class ExampleProvisioner implements IClusterProvisioner {
  static ID = 'test';
  /* eslint-disable no-useless-constructor */
  constructor(private context: {
    dispatch: any,
    getters: any,
    axios: any,
    $plugin: any,
    $t: any
  }) { }

  get id(): String {
    return ExampleProvisioner.ID;
  }

  get namespaced(): boolean {
    return true;
  }

  get icon(): any {
    return require('./icon.svg');
  }

  get machineConfigSchema(): { [key: string]: any } {
    return { id: 'rke-machine-config.cattle.io.testconfig' };
  }

  async createMachinePoolMachineConfig(idx: number, pools: any) { // eslint-disable-line require-await
    return {};
  }

  registerSaveHooks(registerBeforeHook: ClusterSaveHook, registerAfterHook: ClusterSaveHook, cluster: any): void {
    console.debug('registerSaveHooks');

    console.debug(registerBeforeHook);
    console.debug(registerAfterHook);

    console.debug(this);

    registerBeforeHook(this.before, 'custom-before-hook');
  }

  /**
   * Example of a function that will run in the before hook
   */
  before() { //
    console.debug('>>>>>>');
    console.debug(arguments);
  }

  async saveMachinePoolConfigs(pools: any[], cluster: any) { // eslint-disable-line require-await
    return true;
  }

  get detailTabs() {
    return {
      machines:     false,
      logs:         false,
      registration: false,
      snapshots:    false,
      related:      true,
      events:       false,
      conditions:   false,
    };
  }

  // Returns an array of error messages or an empty array if provisioning was successful
  async provision(cluster: any, pools: any) {
    console.debug('provision');
    console.debug('---------');

    console.debug(cluster);
    console.debug(pools);

    const { dispatch } = this.context;

    cluster.metadata.annotations = cluster.metadata.annotations || {};
    cluster.metadata.annotations[CAPI.PROVIDER_UI] = this.id;

    // Create an empty cluster - this will show up as an imported cluster in the UI
    const rancherCluster = await dispatch('management/create', {
      type:     RANCHER_CLUSTER,
      metadata: {
        name:      cluster.name,
        namespace: cluster.namespace,
      },
      spec: { rkeConfig: {} }
    });

    console.debug(rancherCluster);

    try {
      await cluster.save();
    } catch (e) {
      console.error(e); // eslint-disable-line no-console

      return [e];
    }

    return [];
  }
}

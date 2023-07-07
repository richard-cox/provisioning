import { IClusterProvisioner } from '@shell/core/types';

import { CAPI } from '@shell/config/labels-annotations';

const RANCHER_CLUSTER = 'provisioning.cattle.io.cluster';

type SaveHook = (hook: Function, name: string) => void;

export class ExampleProvisioner implements IClusterProvisioner {
  static ID = 'test';

  constructor(private context: any) { } // eslint-disable-line no-useless-constructor

  get id(): String {
    return ExampleProvisioner.ID;
  }

  get namespaced(): boolean {
    return true;
  }

  get icon(): any {
    return require('./icon.svg');
  }

  get machineConfigSchema(): any {
    return { id: 'rke-machine-config.cattle.io.testconfig' }; // TODO: RC needs to be created??
  }

  // Create a new, populated machine pool - returns a machine pool model
  createMachinePool(idx: number, pools: any) {
    return {};
  }

  registerSaveHooks(registerBeforeHook: SaveHook, registerAfterHook: SaveHook, context: any): void {
    console.debug('registerSaveHooks');

    console.debug(registerBeforeHook);
    console.debug(registerAfterHook);

    console.debug(this);

    registerBeforeHook(this.before, 'custom-before-hook');
  }

  before() {
    console.debug('>>>>>>');
    console.debug(arguments);
  }

  saveMachinePools() {
    return true;
  }

  // Override which tabs should be shown
  // Hide all
  get detailTabs() {
    return {
      machines:     false, // custom
      logs:         false, // custom
      registration: false, // custom
      snapshots:    false,
      related:      true, // needRelated
      events:       true, // needEvents
      conditions:   true, // needConditions
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

import { IClusterProvisioner } from '@shell/core/types';

import { PROVIDER as PROVIDER_ANNOTATION} from '@shell/config/labels-annotations';

const RANCHER_CLUSTER = 'provisioning.cattle.io.cluster';

type SaveHook = (hook: Function, name: string) => void;

export class ExampleProvisioner implements IClusterProvisioner {
  constructor(private context: any) {
    console.error('ExampleProvisioner');

    console.log(this.context);
  }

  get id(): String {
    return 'test';
  }

  get namespaced(): boolean {
    return true;
  }

  get icon(): any {
    return require('./icon.svg');
  }

  get machineConfigSchema(): any {
    return {
      id: 'rke-machine-config.cattle.io.testconfig'
    };
  }

  // Create a new, populated machine pool - returns a machine pool model
  createMachinePool(idx: number, pools: any) {
    return {};
  }

  registerSaveHooks(registerBeforeHook: SaveHook, registerAfterHook: SaveHook, context: any) {
    console.error('registerSaveHooks');

    console.log(registerBeforeHook);
    console.log(registerAfterHook);

    console.log(this);
    
    registerBeforeHook(this.before, 'custom-before-hook');
  }

  before() {
    console.error('>>>>>>');
    console.error(arguments);
  }

  saveMachinePools() {
    return true;
  }

  // Override which tabs should be shown
  // Hide all
  get detailTabs() {
    return {
      machines:     false,
      logs:         false,
      registration: false,
      snapshots:    false,
      related:      false,
      events:       false,
      conditions:   false,
    };
  }

  // Returns an array of error messages or an empty array if provisioning was successful
  async provision(cluster: any, pools: any) {
    console.error('provision');
    console.error('---------');

    console.log(cluster);
    console.log(pools);

    const { dispatch } = this.context;

    cluster.metadata.annotations = cluster.metadata.annotations || {};
    cluster.metadata.annotations[PROVIDER_ANNOTATION] = this.id;

    // Create an empty cluster - this will show up as an imported cluster in the UI
    const rancherCluster = await dispatch('management/create', {
      type: RANCHER_CLUSTER,
      metadata: {
        name:      cluster.name,
        namespace: cluster.namespace,
      },
      spec: {
        rkeConfig: {

        }
      }
    });

    console.error(rancherCluster);

    try {
      await cluster.save();
    } catch (e) {
      console.error(e);

      return [e];
    }

    return [];
  }
}

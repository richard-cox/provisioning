import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';
import { ExampleProvisioner } from './provisioner';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register custom provisioner object
  plugin.register('provisioner', ExampleProvisioner.ID, ExampleProvisioner);

  // Register that no cloud-credential needed
  plugin.register('cloud-credential', ExampleProvisioner.ID, false);

  // Register custom machine config component
  plugin.register('machine-config', ExampleProvisioner.ID, () => import('./src/example-machine-config.vue'));

  // Register an example tab component shown in the cluster detail page tabs
  plugin.addTab(TabLocation.RESOURCE_DETAIL, {
    resource:     ['provisioning.cattle.io.cluster'],
    context:   { provider: ExampleProvisioner.ID }
  }, {
    name:      'custom',
    label:     'Custom Tab',
    component: () => import('./src/example-resource-detail-tab.vue')
  });

  // Register an example tab component shown in the cluster create/edit `Cluster Configuration` tabs
  plugin.addTab(TabLocation.CLUSTER_CREATE_RKE2, {
    resource:     ['provisioning.cattle.io.cluster'],
    queryParam:    { type: ExampleProvisioner.ID }
  }, {
    name:      'custom-cluster-config',
    labelKey:     'exampleClusterConfigTab.tabLabel',
    weight:    1,
    tooltip:   'This is an example tool tip',
    component: () => import('./src/example-cluster-config-tab.vue')
  });
}

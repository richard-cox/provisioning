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

  // Register an example tab component shown in the cluster detail page
  plugin.addTab(TabLocation.RESOURCE_DETAIL, {
    resource:     ['provisioning.cattle.io.cluster'],
    customParams:   { provider: ExampleProvisioner.ID }
  }, {
    name:      'custom',
    label:     'Custom Tab',
    component: () => import('./src/example-tab.vue')
  });
}

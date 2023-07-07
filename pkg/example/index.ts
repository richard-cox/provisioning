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

  // Register cloud-credential component
  plugin.register('provisioner', ExampleProvisioner.ID, ExampleProvisioner);

  plugin.register('cloud-credential', ExampleProvisioner.ID, false); // TODO: RC there's a comment rancher side to wire this in
  plugin.register('machine-config', ExampleProvisioner.ID, () => import('./src/example-machine-config.vue'));

  plugin.addTab(TabLocation.RESOURCE_DETAIL, {
    resource:     ['provisioning.cattle.io.cluster'],
    customParams:   { provider: ExampleProvisioner.ID }
  }, {
    name:      'custom',
    label:     'Custom Tab',
    component: () => import('./src/example-tab.vue')
  });
}

// TODO: RC Create a `-dev` build and supply instructions on how to use it
// TODO: RC Document new extension points as part of dashboard changes
// - resources created (cloud creds)
// - resources needed (machine config stuff)
// TODO: RC review documentation in this repo
// TODO: RC add @shell/config/labels-annotations to types (and regenerate types file)
// TODO: RC TEST - provisioning as non-admin (access to mgmt namespaces)

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
  plugin.register('provisioner', 'test', ExampleProvisioner);

  plugin.register('cloud-credential', 'test', false); // TODO: RC there's a comment rancher side to wire this in
  plugin.register('machine-config', 'test', () => import('./src/example-machine-config.vue'));

  plugin.addTab(TabLocation.RESOURCE_DETAIL, {
    resource: ['provisioning.cattle.io.cluster'],
    params:   { type: 'test' } // TODO: RC there's no ?provider=test in the rke2 cluster detail page url
  }, {
    name:      'custom',
    label:     'Custom Tab',
    component: () => import('./src/example-tab.vue')
  });

  console.error('Registered Example Provisioner extension');
}

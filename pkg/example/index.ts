import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';
import { ExampleProvisioner } from './provisionner';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register custom provisioner object

  // Register cloud-credential component
  plugin.register('provisioner', 'test', ExampleProvisioner);

  plugin.register('cloud-credential', 'test', false);
  plugin.register('machine-config', 'test', () => import('./src/test.vue'));

  plugin.addTab(TabLocation.RESOURCE_DETAIL, {
    resource: ['provisioning.cattle.io.cluster'],
    params: { provider: 'test' }
  }, {
    name: 'custom',
    label: 'Custom Tab',
    component: () => import('./src/test.vue')
  });

  console.error('Registered Example Provisioner extension');
}

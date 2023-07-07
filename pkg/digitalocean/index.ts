import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { DigitalOceanProvisioner } from './digitalOceanProvisioner';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register custom provisioner object
  plugin.register('provisioner', DigitalOceanProvisioner.ID, DigitalOceanProvisioner);

  // Register that no cloud-credential needed
  plugin.register('cloud-credential', DigitalOceanProvisioner.ID, () => import('./src/cloud-credential.vue'));

  // Register custom machine config component
  plugin.register('machine-config', DigitalOceanProvisioner.ID, () => import('./src/machine-config.vue'));
}

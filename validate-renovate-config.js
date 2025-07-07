#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateRenovateConfig(configPath) {
  console.log('🔍 Validating Renovate configuration...\n');
  
  try {
    // Check if file exists
    if (!fs.existsSync(configPath)) {
      console.error('❌ Config file not found:', configPath);
      process.exit(1);
    }
    
    // Parse JSON
    const configContent = fs.readFileSync(configPath, 'utf8');
    let config;
    try {
      config = JSON.parse(configContent);
      console.log('✅ JSON syntax is valid');
    } catch (parseError) {
      console.error('❌ JSON syntax error:', parseError.message);
      process.exit(1);
    }
    
    // Basic structure validation
    console.log('✅ Config has', Object.keys(config).length, 'top-level properties');
    
    // Check for required/recommended properties
    const checks = [
      {
        property: '$schema',
        required: false,
        check: (val) => val && val.includes('renovate-schema.json'),
        message: 'JSON Schema reference for IDE support'
      },
      {
        property: 'extends',
        required: false,
        check: (val) => Array.isArray(val) && val.length > 0,
        message: 'Base configurations to extend'
      },
      {
        property: 'schedule',
        required: false,
        check: (val) => Array.isArray(val) && val.length > 0,
        message: 'Schedule configuration'
      },
      {
        property: 'timezone',
        required: false,
        check: (val) => typeof val === 'string' && val.length > 0,
        message: 'Timezone setting'
      },
      {
        property: 'stabilityDays',
        required: false,
        check: (val) => typeof val === 'number' && val >= 0,
        message: 'Stability days configuration'
      },
      {
        property: 'minimumReleaseAge',
        required: false,
        check: (val) => typeof val === 'string' || val === null,
        message: 'Minimum release age setting'
      },
      {
        property: 'packageRules',
        required: false,
        check: (val) => Array.isArray(val),
        message: 'Package-specific rules'
      }
    ];
    
    console.log('\n📋 Configuration validation:');
    checks.forEach(({ property, required, check, message }) => {
      const value = config[property];
      const exists = value !== undefined;
      const valid = exists ? check(value) : !required;
      
      if (exists && valid) {
        console.log(`✅ ${property}: ${message}`);
      } else if (exists && !valid) {
        console.log(`⚠️  ${property}: Invalid value - ${message}`);
      } else if (required) {
        console.log(`❌ ${property}: Missing required property - ${message}`);
      } else {
        console.log(`ℹ️  ${property}: Not configured - ${message}`);
      }
    });
    
    // Validate schedule format
    if (config.schedule) {
      console.log('\n📅 Schedule validation:');
      config.schedule.forEach((schedule, index) => {
        if (typeof schedule === 'string') {
          console.log(`✅ Schedule ${index + 1}: "${schedule}"`);
        } else {
          console.log(`⚠️  Schedule ${index + 1}: Invalid format (should be string)`);
        }
      });
    }
    
    // Validate package rules
    if (config.packageRules && Array.isArray(config.packageRules)) {
      console.log('\n📦 Package rules validation:');
      config.packageRules.forEach((rule, index) => {
        const ruleNum = index + 1;
        if (typeof rule !== 'object') {
          console.log(`❌ Rule ${ruleNum}: Must be an object`);
          return;
        }
        
        if (rule.description) {
          console.log(`✅ Rule ${ruleNum}: "${rule.description}"`);
        } else {
          console.log(`ℹ️  Rule ${ruleNum}: No description provided`);
        }
        
        // Check for at least one matcher
        const matchers = [
          'matchPackageNames', 'matchPackagePatterns', 'matchDepTypes',
          'matchUpdateTypes', 'matchConfidence', 'matchCurrentVersion'
        ];
        const hasMatchers = matchers.some(matcher => rule[matcher]);
        
        if (!hasMatchers) {
          console.log(`⚠️  Rule ${ruleNum}: No matchers found - rule may not apply to any packages`);
        }
      });
    }
    
    // Check for potential conflicts
    console.log('\n🔍 Conflict detection:');
    
    // Check for conflicting extends
    if (config.extends && config.extends.includes(':automergeDisabled') && config.extends.includes(':automergeAll')) {
      console.log('⚠️  Potential conflict: Both automergeDisabled and automergeAll are extended');
    } else {
      console.log('✅ No obvious automerge conflicts detected');
    }
    
    // Check stability vs minimum release age
    if (config.stabilityDays && config.minimumReleaseAge) {
      const stabilityMs = config.stabilityDays * 24 * 60 * 60 * 1000;
      const ageMatch = config.minimumReleaseAge.match(/(\d+)\s*(day|hour|week)s?/);
      if (ageMatch) {
        const [, num, unit] = ageMatch;
        const multiplier = unit === 'day' ? 24 * 60 * 60 * 1000 : 
                          unit === 'hour' ? 60 * 60 * 1000 : 
                          7 * 24 * 60 * 60 * 1000;
        const ageMs = parseInt(num) * multiplier;
        
        if (Math.abs(stabilityMs - ageMs) > 24 * 60 * 60 * 1000) {
          console.log('⚠️  stabilityDays and minimumReleaseAge have significant difference');
        } else {
          console.log('✅ stabilityDays and minimumReleaseAge are aligned');
        }
      }
    }
    
    console.log('\n🎉 Validation complete!');
    console.log('\n💡 To test this config with a real repository:');
    console.log('   1. Set GITHUB_TOKEN environment variable');
    console.log('   2. Run: npx renovate --dry-run --print-config <repository>');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run validation
const configFile = process.argv[2] || '.renovaterc';
validateRenovateConfig(configFile);

#!/usr/bin/env node

/**
 * Cleanup History Script
 *
 * Usage: node scripts/cleanup-history.js --keep 5
 *
 * Deletes all but the N most recent history items and their associated images
 * from Supabase. Requires confirmation before deletion.
 *
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../app/.env.local') });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  if (!supabaseKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nThese should be defined in app/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI arguments
const args = process.argv.slice(2);
const keepIndex = args.indexOf('--keep');

if (keepIndex === -1 || keepIndex === args.length - 1) {
  console.error('❌ Missing required parameter: --keep');
  console.error('\nUsage: node scripts/cleanup-history.js --keep 5');
  console.error('');
  console.error('Arguments:');
  console.error('  --keep N    Keep the N most recent history items, delete the rest');
  process.exit(1);
}

const keepCount = parseInt(args[keepIndex + 1], 10);

if (isNaN(keepCount) || keepCount < 0) {
  console.error(`❌ Invalid value for --keep: "${args[keepIndex + 1]}"`);
  console.error('Please provide a non-negative integer.');
  process.exit(1);
}

// ===== Helper Functions =====

/**
 * Query all history items sorted by creation date (newest first)
 */
async function queryHistoryItems() {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, created_at, image_paths')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to query history items: ${error.message}`);
  }

  return data || [];
}

/**
 * Identify items to delete (beyond N most recent)
 */
function identifyItemsToDelete(allItems, keepCount) {
  if (allItems.length <= keepCount) {
    return {
      toKeep: allItems,
      toDelete: [],
      totalImages: 0,
    };
  }

  const toKeep = allItems.slice(0, keepCount);
  const toDelete = allItems.slice(keepCount);

  // Count total images (assuming 4 images per item)
  const totalImages = toDelete.length * 4;

  return { toKeep, toDelete, totalImages };
}

/**
 * Prompt user for confirmation
 */
async function promptForConfirmation(itemCount, imageCount) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      `About to delete ${itemCount} history items and ${imageCount} images. Type 'yes' to confirm: `,
      (answer) => {
        rl.close();
        resolve(answer === 'yes');
      }
    );
  });
}

/**
 * Delete history items from database
 */
async function deleteHistoryItems(itemIds) {
  const errors = [];

  for (const itemId of itemIds) {
    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', itemId);

      if (error) {
        errors.push({ itemId, error: error.message });
      }
    } catch (err) {
      errors.push({ itemId, error: err.message });
    }
  }

  return errors;
}

/**
 * Delete S3 images associated with deleted items
 */
async function deleteImages(itemsToDelete) {
  const errors = [];
  let deletedCount = 0;

  for (const item of itemsToDelete) {
    if (!item.image_paths || !Array.isArray(item.image_paths) || item.image_paths.length === 0) {
      continue;
    }

    for (const imagePath of item.image_paths) {
      try {
        // Delete from Supabase storage bucket
        const { error } = await supabase.storage.from('analysis-images').remove([imagePath]);

        if (error) {
          errors.push({ imagePath, error: error.message });
        } else {
          deletedCount++;
        }
      } catch (err) {
        errors.push({ imagePath, error: err.message });
      }
    }
  }

  return { deletedCount, errors };
}

/**
 * Main cleanup function
 */
async function cleanup() {
  try {
    console.log('🔍 Querying history items...');
    const allItems = await queryHistoryItems();
    console.log(`   Found ${allItems.length} total items`);

    const { toDelete, totalImages } = identifyItemsToDelete(allItems, keepCount);

    if (toDelete.length === 0) {
      console.log(`\n✅ No items to delete (keeping ${keepCount}, have ${allItems.length})`);
      process.exit(0);
    }

    console.log(`\n📦 Deletion preview:`);
    console.log(`   Items to delete: ${toDelete.length}`);
    console.log(`   Images to delete: ${totalImages}`);
    console.log(`   Items to keep: ${keepCount}`);

    // Get confirmation
    const confirmed = await promptForConfirmation(toDelete.length, totalImages);

    if (!confirmed) {
      console.log('\n❌ Deletion cancelled by user');
      process.exit(0);
    }

    console.log('\n🗑️  Deleting history items...');
    const deleteErrors = await deleteHistoryItems(toDelete.map((item) => item.id));

    if (deleteErrors.length > 0) {
      console.log(`   ⚠️  ${deleteErrors.length} errors during history deletion:`);
      deleteErrors.forEach((err) => {
        console.log(`      - Item ${err.itemId}: ${err.error}`);
      });
    }

    const successfulHistoryDeletes = toDelete.length - deleteErrors.length;
    console.log(`   ✓ Successfully deleted ${successfulHistoryDeletes} items`);

    console.log('\n🖼️  Deleting associated images...');
    const { deletedCount, errors: imageErrors } = await deleteImages(toDelete);

    if (imageErrors.length > 0) {
      console.log(`   ⚠️  ${imageErrors.length} errors during image deletion:`);
      imageErrors.forEach((err) => {
        console.log(`      - ${err.imagePath}: ${err.error}`);
      });
    }

    console.log(`   ✓ Successfully deleted ${deletedCount} images`);

    // Final summary
    console.log('\n✅ Cleanup complete!');
    console.log(`   Deleted ${successfulHistoryDeletes} history items and ${deletedCount} images`);

    if (deleteErrors.length > 0 || imageErrors.length > 0) {
      console.log(`   ⚠️  ${deleteErrors.length + imageErrors.length} errors occurred during deletion. Check logs above for details.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  }
}

// Run cleanup
cleanup();

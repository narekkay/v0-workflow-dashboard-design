#!/bin/bash
# Fix createBrowserClient imports to use createClient

FILES=(
  "components/client-revenues-table-premium.tsx"
  "components/client-revenues-table.tsx"
  "components/client-tabs.tsx"
  "components/form-2042-view.tsx"
  "components/notifications-dropdown.tsx"
  "components/onboarding-view.tsx"
  "components/revenue-detail-tab.tsx"
  "components/revenue-full-page.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Replace import statement
    sed -i 's/createBrowserClient/createClient/g' "$file"
    echo "Fixed: $file"
  fi
done

echo "All files updated successfully!"

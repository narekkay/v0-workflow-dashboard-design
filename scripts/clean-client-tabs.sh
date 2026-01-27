#!/bin/bash
# Remove stray > characters at the beginning of lines
sed -i 's/^> //' /project/components/client-tabs.tsx
sed -i 's/^>//' /project/components/client-tabs.tsx

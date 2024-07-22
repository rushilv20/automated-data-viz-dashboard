import pandas as pd

# Read the Excel file
df = pd.read_excel('C:/Users/rushi/Desktop/Projects/automated-data-viz-dashboard/Analytics  Aircraft  Logged flights 01012023 - 12312023.xlsx')

# Find duplicate rows based on 'Trip' and 'Orig'
duplicates = df[df.duplicated(subset=['Trip', 'Orig'], keep=False)]

# Sort the duplicates for easier viewing
duplicates = duplicates.sort_values(['Trip', 'Orig'])

# Display the number of duplicate rows
print(f"Number of rows with duplicate Trip and Orig: {len(duplicates)}")

# Display the duplicate rows
if not duplicates.empty:
    print("\nDuplicate rows:")
    print(duplicates)
else:
    print("\nNo duplicates found.")


# Get unique combinations of Trip and Orig
# unique_combinations = df[['Trip', 'Orig']].drop_duplicates()

# print(f"\nTotal number of rows: {len(df)}")
# print(f"Number of unique Trip-Orig combinations: {len(unique_combinations)}")

# if len(df) != len(unique_combinations):
#     print("There are duplicate Trip-Orig combinations in the data.")
# else:
#     print("All Trip-Orig combinations are unique.")
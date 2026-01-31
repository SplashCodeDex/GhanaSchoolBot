$baseDir = "w:\CodeDeX\GhanaSchoolBot\educational-scraper\downloads"

# JHS Subjects (Common Core)
$jhsSubjects = @(
    "English Language", "Mathematics", "Science", "Social Studies",
    "Computing_ICT", "Career Technology", "Creative Arts and Design_CAD",
    "Religious and Moral Education_RME", "Ghanaian Language", "French",
    "Physical and Health Education_PHE"
)

# SHS Subjects (Core + Common Electives)
$shsSubjects = @(
    "English Language", "Mathematics_Core", "Integrated Science", "Social Studies",
    "Physics", "Chemistry", "Biology", "Mathematics_Elective",
    "Economics", "Geography", "History", "Government",
    "Literature-in-English", "Religious and Moral Education_RME",
    "Information and Communication Technology_ICT", "Computing",
    "Food and Nutrition", "Clothing and Textiles", "Management in Living",
    "General Knowledge in Art", "Graphic Design", "Picture Making",
    "Leatherwork", "Sculpture", "Textiles", "Ceramics",
    "Business Management", "Financial Accounting", "Cost Accounting",
    "Applied Electricity", "Electronics", "Auto Mechanics", "Building Construction",
    "Metalwork", "Technical Drawing", "Woodwork",
    "French", "Music", "Physical Education_PHE"
)

# Classes
$jhsClasses = @("Grade7_JHS1", "Grade8_JHS2", "Grade9_JHS3")
$shsClasses = @("SHS1", "SHS2", "SHS3")

# Create JHS Folders
foreach ($class in $jhsClasses) {
    foreach ($subject in $jhsSubjects) {
        $path = Join-Path $baseDir $class $subject
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Force -Path $path | Out-Null
            Write-Host "Created: $path"
        }
    }
}

# Create SHS Folders
foreach ($class in $shsClasses) {
    foreach ($subject in $shsSubjects) {
        $path = Join-Path $baseDir $class $subject
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Force -Path $path | Out-Null
            Write-Host "Created: $path"
        }
    }
}

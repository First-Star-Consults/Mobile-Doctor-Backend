// Function to determine the role based on the userType field
const determineRole = (userType) => {
    switch (userType) {
        case 'doctor':
            return 'doctor';
        case 'patient':
            return 'patient';
        case 'pharmacy':
            return 'pharmacy';
        case 'laboratory':
            return 'laboratory';
        case 'Therapist':
            return 'Therapist';
        default:
            return 'patient';
    }
};


const determineSubRole = (subUserType) => {
    switch (subUserType) {
        case 'child healthcare/support':
            return 'child healthcare/support';
        case 'Dermatology/Skin Care':
            return 'Dermatology/Skin Care';
        case 'General Surgery':
            return 'General Surgery';
        case 'Dental/Oral Care':
            return 'Dental/Oral Care';
        case 'Mental Health':
            return 'Mental Health';
        case 'Stroke/Heptathletes':
            return 'Stroke/Heptathletes';
        default:
            return 'Health Provider';
    }
};

export  {determineRole, determineSubRole};
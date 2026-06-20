const BIRTH = new Date('2009-09-02')

function calcAge() {
  const today = new Date()
  let age = today.getFullYear() - BIRTH.getFullYear()
  const m = today.getMonth() - BIRTH.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < BIRTH.getDate())) age--
  return age
}

// Evaluated once at page load — refreshing re-calculates correctly
export const AGE  = calcAge()
export const YEAR = new Date().getFullYear()

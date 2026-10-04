/** "Nombre Apellido", sin espacios sobrantes cuando falta alguno de los dos. */
export function fullName(person: {
  first_name: string;
  last_name: string;
}): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

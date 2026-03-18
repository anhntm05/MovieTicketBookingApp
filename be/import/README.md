# Mongo Import Seed Files

Import order:

1. `users.json`
2. `movies.json`
3. `cinemas.json`
4. `screens.json`
5. `seats.json`
6. `showtimes.json`
7. `showtimeSeats.json`
8. `bookings.json`
9. `payments.json`
10. `comments.json`

`bookings.json` now includes embedded `concessions` items used by the customer ticket-detail screen, so re-import `bookings.json` and `payments.json` together if you want the sample totals to stay consistent.

Example:

```powershell
mongoimport --uri "mongodb://localhost:27017/movie-ticket-booking" --collection users --jsonArray --file be/import/users.json
```

Sample credentials:

- `admin@example.com` / `Admin123!`
- `staff@example.com` / `Staff123!`
- `customer.one@example.com` / `Customer123!`
- `customer.two@example.com` / `Customer456!`

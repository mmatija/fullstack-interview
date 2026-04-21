# Observations

Data which was provided as mocked values does not seem to match the expected structure and business logic:
  
* Existing endpoint for fetching memberships does not seems to be working as intended for given mocked values - it always returns an empty array of periods because the matching happens on an attribute that does not exist (`membershipPeriod.membershipId` instead of `membershipPeriod.membership`). However, when adding new periods, the attribute would be set correctly, so the endpoint would work as intended for newly created memberships.
* Some of the data does not match the validation rules - for example, plan with id `123e4567-e89b-12d3-a456-426614174001` is a 2 month plan, but `validFrom` and `validUntil` values are set to 1 year apart, which does not match the plan duration.
* All periods have `state` set to `issued`, but all periods are hardcoded to `planned` in actual legacy implementation.
* Because of this I decided to treat the "*The response from the endpoints should be exactly the same*" in a way that **response should follow the same structure and business logic as the legacy implementation, but not necessarily match the mocked values**, which seem to be wrong. I have also added some comments in the code where I noticed these inconsistencies.
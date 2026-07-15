from checks.standards_version_known_loss import check_tested_version_known_loss
def test_requires_version():
    assert check_tested_version_known_loss({"known_loss": ["x"]})
    assert check_tested_version_known_loss({"tested_version": "1", "known_loss": ["x"]}) == []

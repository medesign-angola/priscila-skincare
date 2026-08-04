using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Reviews;
using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Customers;
using PriscilaSkincare.Domain.Reviews;

namespace PriscilaSkincare.Api.Tests.Application;

public sealed class ReviewServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 3, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Submit_CreatesPendingReviewAndProjectsIt()
    {
        var fixture = new Fixture();

        var result = await fixture.Service.SubmitAsync(new SubmitReviewCommand(
            fixture.Customer.Id, "SNOW-001", 5, "Excelente", "A minha pele ficou muito luminosa.", true));

        Assert.Equal("pending", result.Status);
        Assert.Single(fixture.Reviews.Items);
        Assert.Equal(1, fixture.Projection.Calls);
        Assert.Equal(ReviewSyncStatus.Synced, fixture.Reviews.Items[0].SyncStatus);
    }

    [Fact]
    public async Task Submit_ForSameCustomerAndProduct_EditsExistingReview()
    {
        var fixture = new Fixture();
        var command = new SubmitReviewCommand(fixture.Customer.Id, "SNOW-001", 5, "Excelente", "A minha pele ficou muito luminosa.", true);
        await fixture.Service.SubmitAsync(command);

        var result = await fixture.Service.SubmitAsync(command with { Rating = 4, Title = "Muito bom" });

        Assert.Single(fixture.Reviews.Items);
        Assert.Equal(4, result.Rating);
        Assert.Equal("Muito bom", result.Title);
    }

    [Fact]
    public async Task Submit_WhenProductDoesNotExist_IsRejected()
    {
        var fixture = new Fixture(productExists: false);

        var exception = await Assert.ThrowsAsync<ReviewException>(() => fixture.Service.SubmitAsync(
            new SubmitReviewCommand(fixture.Customer.Id, "UNKNOWN", 5, "Excelente", "Comentário suficientemente longo.", true)));

        Assert.Equal("product_not_found", exception.Code);
        Assert.Empty(fixture.Reviews.Items);
    }

    [Fact]
    public async Task Moderate_PublishesReview()
    {
        var fixture = new Fixture();
        var submitted = await fixture.Service.SubmitAsync(new SubmitReviewCommand(
            fixture.Customer.Id, "SNOW-001", 5, "Excelente", "A minha pele ficou muito luminosa.", true));

        await fixture.Service.ModerateAsync(new ModerateReviewCommand(submitted.Id, "published"));

        Assert.Equal(ReviewStatus.Published, fixture.Reviews.Items[0].Status);
    }

    private sealed class Fixture
    {
        public Customer Customer { get; }
        public ReviewMemoryRepository Reviews { get; } = new();
        public ProjectionStub Projection { get; } = new();
        public ReviewService Service { get; }

        public Fixture(bool productExists = true)
        {
            Customer = Customer.Register(EmailAddress.Create("cliente@example.com"), Now);
            Customer.UpdateProfile("Maria", null, Now);
            Service = new ReviewService(
                Reviews,
                new CustomerRepositoryStub(Customer),
                new CatalogStub(productExists),
                Projection,
                new UnitOfWorkStub(),
                new ClockStub());
        }
    }

    private sealed class ReviewMemoryRepository : IReviewRepository
    {
        public List<ProductReview> Items { get; } = [];
        public Task<ProductReview?> FindAsync(Guid customerId, string productSku, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.CustomerId == customerId && item.ProductSku.Value == productSku));
        public Task<ProductReview?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.Id == id));
        public Task<(IReadOnlyList<ReviewReadModel> Items, int Total, double Average)> GetPublishedAsync(string productSku, int page, int pageSize, CancellationToken cancellationToken = default) =>
            Task.FromResult(((IReadOnlyList<ReviewReadModel>)[], 0, 0d));
        public Task<(int Total, double Average)> GetGlobalSummaryAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult((0, 0d));
        public void Add(ProductReview review) => Items.Add(review);
    }

    private sealed class CustomerRepositoryStub(Customer customer) : ICustomerRepository
    {
        public Task<Customer?> FindByEmailAsync(EmailAddress email, CancellationToken cancellationToken = default) => Task.FromResult<Customer?>(customer);
        public Task<Customer?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(id == customer.Id ? customer : null);
        public void Add(Customer value) { }
    }

    private sealed class CatalogStub(bool exists) : ICatalogGateway
    {
        public Task<CatalogProduct?> FindBySkuAsync(ProductSku sku, string locale, CancellationToken cancellationToken = default) =>
            Task.FromResult(exists ? new CatalogProduct(sku, "Produto", 0, 0, true) : null);
    }

    private sealed class ProjectionStub : IReviewProjection
    {
        public int Calls { get; private set; }
        public Task<string?> UpsertAsync(ProductReview review, Customer customer, CancellationToken cancellationToken = default)
        {
            Calls++;
            return Task.FromResult<string?>("strapi-document-id");
        }
    }

    private sealed class UnitOfWorkStub : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
    }

    private sealed class ClockStub : IClock { public DateTimeOffset UtcNow => Now; }
}
